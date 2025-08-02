-- Function to insert profile when user signs up
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, department, role)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'department',
    new.raw_user_meta_data ->> 'role'
  );
  RETURN new;
END;
$$;

-- Trigger the function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();