-- university_type制約に「国公立」を追加
ALTER TABLE user_schedules
  DROP CONSTRAINT IF EXISTS user_schedules_university_type_check;

ALTER TABLE user_schedules
  ADD CONSTRAINT user_schedules_university_type_check
  CHECK (university_type IN ('国立', '公立', '私立', '国公立'));
