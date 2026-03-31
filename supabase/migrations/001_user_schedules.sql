-- =============================================
-- user_schedulesテーブル（ユーザーのマイカレンダー）
-- =============================================
-- 既存DBから追加した学校も、手動入力した学校も一元管理する
-- university_schedule_id IS NOT NULL → 既存DBから追加
-- university_schedule_id IS NULL     → 手動入力

CREATE TABLE IF NOT EXISTS user_schedules (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  -- 既存DBから追加した場合（任意）
  university_schedule_id  uuid REFERENCES university_schedules ON DELETE SET NULL,
  -- 学校情報（既存連携時はコピー、手動入力時は直接入力）
  university_name         text NOT NULL,
  university_name_zh      text,
  university_type         text NOT NULL DEFAULT '私立'
    CHECK (university_type IN ('国立', '公立', '私立')),
  department              text,
  -- 日程
  application_start       date,
  application_end         date,
  exam_date               date,
  interview_date          date,
  result_date             date,
  -- ステータス
  status                  text NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'applied', 'examined', 'passed', 'failed')),
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE user_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のスケジュールのみ参照可能"
  ON user_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のスケジュールのみ追加可能"
  ON user_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のスケジュールのみ更新可能"
  ON user_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のスケジュールのみ削除可能"
  ON user_schedules FOR DELETE
  USING (auth.uid() = user_id);
