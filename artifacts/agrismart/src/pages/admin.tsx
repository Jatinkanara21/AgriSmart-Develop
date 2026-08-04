import { useState } from 'react';
import { useAdminListUsers, useAdminUpdateUserRole } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Users, ShieldCheck, User, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@clerk/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Admin() {
  const { user: clerkUser } = useUser();
  const isAdmin = clerkUser?.publicMetadata?.role === 'admin';
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useAdminListUsers({ query: { enabled: isAdmin } });
  const updateRole = useAdminUpdateUserRole();

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRole.mutate(
      { id: userId, data: { role: newRole as 'user' | 'admin' } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['adminListUsers'] });
          toast({ title: 'Role updated successfully' });
        },
        onError: () => {
          toast({ title: 'Failed to update role', variant: 'destructive' });
        },
      }
    );
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
        <ShieldCheck className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground max-w-sm">
          You need administrator privileges to view this page.
        </p>
      </div>
    );
  }

  const filtered = search.trim()
    ? (users ?? []).filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : (users ?? []);

  const adminCount = (users ?? []).filter((u) => u.role === 'admin').length;
  const userCount = (users ?? []).filter((u) => u.role !== 'admin').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-1">Manage roles and access for all registered users.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '—' : adminCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Regular Users</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '—' : userCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* User list */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                  <Skeleton className="h-9 w-28" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>{search ? 'No users match your search.' : 'No users found.'}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((u) => {
                const initials = (u.name ?? u.email)
                  .split(' ')
                  .map((w: string) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                const isSelf = u.clerkId === clerkUser?.id;
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-4 py-3 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{u.name ?? '(no name)'}</p>
                        {isSelf && (
                          <Badge variant="outline" className="text-xs py-0">You</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      {u.state && (
                        <p className="text-xs text-muted-foreground">{u.state}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {isSelf ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {u.role}
                        </Badge>
                      ) : (
                        <Select
                          value={u.role ?? 'user'}
                          onValueChange={(v) => handleRoleChange(String(u.id), v)}
                          disabled={updateRole.isPending}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
