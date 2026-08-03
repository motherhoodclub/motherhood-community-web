-- ================================================================
--  MotherhoodClub — Rewards system + admin points/badges management
-- ----------------------------------------------------------------
--  Builds on create_points_system.sql (points, points_ledger, badges,
--  user_badges, grant_badge). Adds a redeemable rewards catalog and the
--  admin-only RPCs the web dashboard uses to manage points, badges and
--  reward fulfilment.
--
--  DEPENDENCY: run create_points_system.sql FIRST.
--  Idempotent — safe to paste into the Supabase SQL editor and re-run.
-- ================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- who is an admin? (self-contained helper) -------------
CREATE OR REPLACE FUNCTION is_admin_caller()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT is_admin FROM user_profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ================================================================
--  Catalog of redeemable rewards
-- ================================================================
CREATE TABLE IF NOT EXISTS rewards (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  description    text,
  type           text NOT NULL DEFAULT 'coupon',   -- coupon | present | offer_code | content
  cost_points    integer NOT NULL CHECK (cost_points >= 0),
  discount_label text,                              -- e.g. "خصم ١٠٪ على استشارة"
  stock          integer,                           -- NULL = unlimited
  valid_days     integer,                           -- code expiry after redemption (NULL = no expiry)
  active         boolean NOT NULL DEFAULT true,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id    uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  cost_points  integer NOT NULL,
  code         text,                                -- coupon/offer code handed to the user
  status       text NOT NULL DEFAULT 'pending',     -- pending | fulfilled | expired | cancelled
  created_at   timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz,
  expires_at   timestamptz
);

CREATE INDEX IF NOT EXISTS reward_redemptions_user_idx   ON reward_redemptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reward_redemptions_status_idx ON reward_redemptions(status);

-- ---------- RLS -------------------------------------------------
ALTER TABLE rewards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- rewards: everyone reads the active catalog; only admins write
DROP POLICY IF EXISTS rewards_select ON rewards;
CREATE POLICY rewards_select ON rewards FOR SELECT USING (active OR is_admin_caller());

DROP POLICY IF EXISTS rewards_admin_write ON rewards;
CREATE POLICY rewards_admin_write ON rewards FOR ALL
  USING (is_admin_caller()) WITH CHECK (is_admin_caller());

-- redemptions: a user sees their own; admins see all. Inserts happen only
-- through redeem_reward(); status changes only through admin RPCs.
DROP POLICY IF EXISTS reward_redemptions_select ON reward_redemptions;
CREATE POLICY reward_redemptions_select ON reward_redemptions FOR SELECT
  USING (auth.uid() = user_id OR is_admin_caller());

DROP POLICY IF EXISTS reward_redemptions_admin_update ON reward_redemptions;
CREATE POLICY reward_redemptions_admin_update ON reward_redemptions FOR UPDATE
  USING (is_admin_caller()) WITH CHECK (is_admin_caller());

-- ================================================================
--  User RPC: redeem a reward (spends points via the ledger)
-- ================================================================
CREATE OR REPLACE FUNCTION redeem_reward(p_reward_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_user   uuid := auth.uid();
  v_reward rewards%ROWTYPE;
  v_points integer;
  v_code   text;
  v_status text;
  v_exp    timestamptz;
  v_redemption_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id;
  IF NOT FOUND OR NOT v_reward.active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unavailable');
  END IF;

  IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'out_of_stock');
  END IF;

  SELECT COALESCE(points, 0) INTO v_points FROM user_profiles WHERE id = v_user FOR UPDATE;
  IF v_points < v_reward.cost_points THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_enough_points',
                              'needed', v_reward.cost_points, 'have', v_points);
  END IF;

  -- Content unlocks are auto-fulfilled; everything else waits for the admin.
  v_status := CASE WHEN v_reward.type = 'content' THEN 'fulfilled' ELSE 'pending' END;
  v_code   := CASE WHEN v_reward.type IN ('coupon', 'offer_code')
                   THEN upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
                   ELSE NULL END;
  v_exp    := CASE WHEN v_reward.valid_days IS NOT NULL
                   THEN now() + (v_reward.valid_days || ' days')::interval ELSE NULL END;

  INSERT INTO reward_redemptions (reward_id, user_id, cost_points, code, status, expires_at, fulfilled_at)
  VALUES (p_reward_id, v_user, v_reward.cost_points, v_code, v_status, v_exp,
          CASE WHEN v_status = 'fulfilled' THEN now() ELSE NULL END)
  RETURNING id INTO v_redemption_id;

  -- Spend the points through the ledger (keeps the running total consistent).
  INSERT INTO points_ledger (user_id, action, points, ref_type, ref_id)
  VALUES (v_user, 'reward_redeem', -v_reward.cost_points, 'reward', v_redemption_id::text);
  UPDATE user_profiles SET points = GREATEST(0, points - v_reward.cost_points) WHERE id = v_user;

  -- Decrement finite stock.
  IF v_reward.stock IS NOT NULL THEN
    UPDATE rewards SET stock = GREATEST(0, stock - 1) WHERE id = p_reward_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'redemption_id', v_redemption_id,
                            'code', v_code, 'status', v_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
--  Admin RPCs (all gated by is_admin_caller)
-- ================================================================

-- Fulfil / cancel / expire a redemption
CREATE OR REPLACE FUNCTION admin_set_redemption_status(p_id uuid, p_status text)
RETURNS void AS $$
BEGIN
  IF NOT is_admin_caller() THEN RAISE EXCEPTION 'not_admin'; END IF;
  IF p_status NOT IN ('pending', 'fulfilled', 'expired', 'cancelled') THEN
    RAISE EXCEPTION 'bad_status';
  END IF;
  UPDATE reward_redemptions
     SET status = p_status,
         fulfilled_at = CASE WHEN p_status = 'fulfilled' THEN now() ELSE fulfilled_at END
   WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manually add/subtract points (audited in the ledger)
CREATE OR REPLACE FUNCTION admin_adjust_points(p_user uuid, p_delta integer, p_reason text DEFAULT NULL)
RETURNS integer AS $$
DECLARE v_new integer;
BEGIN
  IF NOT is_admin_caller() THEN RAISE EXCEPTION 'not_admin'; END IF;
  IF p_delta = 0 THEN
    RETURN (SELECT points FROM user_profiles WHERE id = p_user);
  END IF;

  INSERT INTO points_ledger (user_id, action, points, ref_type, ref_id)
  VALUES (p_user, 'admin_adjust', p_delta, 'admin',
          COALESCE(p_reason, '') || ':' || gen_random_uuid()::text);

  UPDATE user_profiles SET points = GREATEST(0, COALESCE(points, 0) + p_delta)
   WHERE id = p_user
   RETURNING points INTO v_new;

  RETURN v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant a badge from the dashboard (reuses grant_badge for the push)
CREATE OR REPLACE FUNCTION admin_grant_badge(p_user uuid, p_badge text)
RETURNS void AS $$
BEGIN
  IF NOT is_admin_caller() THEN RAISE EXCEPTION 'not_admin'; END IF;
  PERFORM grant_badge(p_user, p_badge);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_revoke_badge(p_user uuid, p_badge text)
RETURNS void AS $$
BEGIN
  IF NOT is_admin_caller() THEN RAISE EXCEPTION 'not_admin'; END IF;
  DELETE FROM user_badges WHERE user_id = p_user AND badge_id = p_badge;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upsert a badge definition (manage the catalog from the dashboard)
CREATE OR REPLACE FUNCTION admin_upsert_badge(
  p_id text, p_name text, p_description text, p_icon text, p_sort_order integer
)
RETURNS void AS $$
BEGIN
  IF NOT is_admin_caller() THEN RAISE EXCEPTION 'not_admin'; END IF;
  INSERT INTO badges (id, name, description, icon, sort_order)
  VALUES (p_id, p_name, p_description, p_icon, COALESCE(p_sort_order, 0))
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name, description = EXCLUDED.description,
        icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION redeem_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_set_redemption_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_adjust_points(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_grant_badge(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_revoke_badge(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_upsert_badge(text, text, text, text, integer) TO authenticated;
