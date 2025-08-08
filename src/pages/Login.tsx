import { useEffect } from 'react';
import { redirect, useActionData, useNavigation, ActionFunctionArgs, useSubmit } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { showError } from '@/utils/toast';

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const username = formData.get('username');
  const password = formData.get('password');

  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return { error: "Vui lòng nhập đầy đủ thông tin." };
  }

  const email = `${username.trim()}@event.app`;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Tên đăng nhập hoặc mật khẩu không đúng." };
  }

  return redirect('/');
};

const Login = () => {
  const actionData = useActionData() as { error: string } | undefined;
  const navigation = useNavigation();
  const submit = useSubmit();
  const loading = navigation.state === 'submitting';

  useEffect(() => {
    if (actionData?.error) {
      showError(actionData.error);
    }
  }, [actionData]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(event.currentTarget, { method: 'post' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff5ea] to-[#e5b899] p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>Nhập thông tin tài khoản của bạn để tiếp tục.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="admin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;