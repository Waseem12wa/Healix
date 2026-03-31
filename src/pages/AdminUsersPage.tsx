import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BackButton from '../ui/BackButton';
import { deleteAdminUser, getAdminUsers, type AdminUser } from '../services/adminService';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAdminUsers({ search: search.trim() || undefined });
      setUsers(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Unable to fetch users.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    const confirmed = window.confirm('Delete this user and all linked records?');
    if (!confirmed) return;

    try {
      await deleteAdminUser(userId);
      setUsers((prev) => prev.filter((item) => item.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
      window.alert('Unable to delete user. Please try again.');
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter((user) => user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q));
  }, [users, search]);

  return (
    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack spacing={2.5}>
        <BackButton />
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#00AFC8' }}>
            User Management
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <TextField
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
            />
            <Button variant="contained" onClick={() => fetchUsers()} sx={{ textTransform: 'none' }}>
              Search
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress />
          </Stack>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Join Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip size="small" label={user.role} />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" color="success" label={user.status} />
                        </TableCell>
                        <TableCell>{new Date(user.joinedDate).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Button
                            color="error"
                            variant="text"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(user.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
