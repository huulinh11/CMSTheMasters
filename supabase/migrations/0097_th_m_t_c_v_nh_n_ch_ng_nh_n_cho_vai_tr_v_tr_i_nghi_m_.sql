-- First, ensure the task exists in the master list
INSERT INTO public.event_tasks_master (name)
VALUES ('Nhận chứng nhận')
ON CONFLICT (name) DO NOTHING;

-- Then, assign this task to the 'Vé trải nghiệm' role
INSERT INTO public.role_tasks (role_name, task_name)
VALUES ('Vé trải nghiệm', 'Nhận chứng nhận')
ON CONFLICT (role_name, task_name) DO NOTHING;