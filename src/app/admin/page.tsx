'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Plus, 
  Save, 
  ChevronRight,
  Loader2,
  Search,
  Settings,
  Users,
  Lock,
  Check,
  X,
  Eye,
  EyeOff,
  MapPin,
  Crosshair,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface CourseHole {
  id: string;
  holeNumber: number;
  par: number;
  handicap: number;
  greenLatitude?: number | null;
  greenLongitude?: number | null;
}

interface GolfCourse {
  id: string;
  name: string;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  totalHoles: number;
  description: string | null;
  designer: string | null;
  yearBuilt: number | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  holes: CourseHole[];
}

interface AppUser {
  id: string;
  email: string;
  name: string | null;
  handicap: number | null;
  city: string | null;
  country: string | null;
  isAdmin: boolean;
  blocked: boolean;
  hiddenFromGolfers: boolean;
  avatar: string | null;
  createdAt: string;
  _count: {
    rounds: number;
    favorites: number;
  };
}

export default function AdminPage() {
  const { toast } = useToast();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(true); // TEMP: Always allow access
  const [authChecking, setAuthChecking] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addCourseDialogOpen, setAddCourseDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '',
    city: '',
    region: '',
    country: 'Morocco',
    latitude: '',
    longitude: '',
    totalHoles: '',
    description: '',
    designer: '',
    yearBuilt: '',
    phone: '',
    website: '',
    address: ''
  });

  const [newCourseForm, setNewCourseForm] = useState({
    name: '',
    city: '',
    region: '',
    country: 'Morocco',
    latitude: '',
    longitude: '',
    totalHoles: '18',
    description: '',
    designer: '',
    yearBuilt: '',
    phone: '',
    website: '',
    address: ''
  });

  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    handicap: '',
    city: '',
    country: '',
    isAdmin: false,
    blocked: false,
    password: ''
  });

  const [editedHoles, setEditedHoles] = useState<CourseHole[]>([]);
  const [maxNearbyDistance, setMaxNearbyDistance] = useState('100');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  // Messages state
  const [messages, setMessages] = useState<Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: { name: string | null; email: string };
  }>>([]);
  const [newMessageTitle, setNewMessageTitle] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [editingMessage, setEditingMessage] = useState<{ id: string; title: string; content: string } | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        if (data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleBackToApp = () => {
    window.location.href = '/';
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCourses();
      fetchSettings();
      fetchUsers();
      fetchMessages();
    }
  }, [isAuthenticated]);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.maxNearbyDistance) {
          setMaxNearbyDistance(data.maxNearbyDistance.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Save settings
  const saveSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxNearbyDistance: parseInt(maxNearbyDistance) || 100 })
      });
      
      if (response.ok) {
        toast({ title: 'Success', description: 'Settings saved successfully' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const response = await fetch('/api/admin/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Create message
  const createMessage = async () => {
    if (!newMessageTitle.trim() || !newMessageContent.trim()) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' });
      return;
    }

    try {
      setMessagesLoading(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: currentUser?.id || 'admin',
          title: newMessageTitle,
          content: newMessageContent
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Message sent successfully' });
        setNewMessageTitle('');
        setNewMessageContent('');
        fetchMessages();
      } else {
        throw new Error('Failed to create message');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setMessagesLoading(false);
    }
  };

  // Update message
  const updateMessage = async () => {
    if (!editingMessage) return;

    try {
      setMessagesLoading(true);
      const response = await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: editingMessage.id,
          title: editingMessage.title,
          content: editingMessage.content,
          adminId: currentUser?.id || 'admin'
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Message updated successfully' });
        setEditingMessage(null);
        fetchMessages();
      } else {
        throw new Error('Failed to update message');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update message', variant: 'destructive' });
    } finally {
      setMessagesLoading(false);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/messages?messageId=${messageId}&adminId=${currentUser?.id || 'admin'}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Message deleted successfully' });
        fetchMessages();
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete message', variant: 'destructive' });
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const openEditDialog = (course: GolfCourse) => {
    setEditForm({
      name: course.name,
      city: course.city,
      region: course.region,
      country: course.country,
      latitude: course.latitude.toString(),
      longitude: course.longitude.toString(),
      totalHoles: course.totalHoles.toString(),
      description: course.description || '',
      designer: course.designer || '',
      yearBuilt: course.yearBuilt?.toString() || '',
      phone: course.phone || '',
      website: course.website || '',
      address: course.address || ''
    });
    setSelectedCourse(course);
    setEditDialogOpen(true);
  };

  const openHolesEditDialog = (course: GolfCourse) => {
    setSelectedCourse(course);
    setEditedHoles([...course.holes]);
    setActiveTab('holes');
  };

  const openUserEditDialog = (user: AppUser) => {
    setEditUserForm({
      name: user.name || '',
      email: user.email,
      handicap: user.handicap?.toString() || '',
      city: user.city || '',
      country: user.country || '',
      isAdmin: user.isAdmin,
      blocked: user.blocked || false,
      password: ''
    });
    setSelectedUser(user);
    setEditUserDialogOpen(true);
  };

  const saveCourseEdit = async () => {
    if (!selectedCourse) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          city: editForm.city,
          region: editForm.region,
          country: editForm.country,
          latitude: parseFloat(editForm.latitude) || 0,
          longitude: parseFloat(editForm.longitude) || 0,
          totalHoles: parseInt(editForm.totalHoles) || 18,
          description: editForm.description,
          designer: editForm.designer,
          yearBuilt: parseInt(editForm.yearBuilt) || null,
          phone: editForm.phone,
          website: editForm.website,
          address: editForm.address
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Course updated successfully' });
        fetchCourses();
        setEditDialogOpen(false);
      } else {
        throw new Error('Failed to update course');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update course', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveUserEdit = async () => {
    if (!selectedUser) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editUserForm.name,
          email: editUserForm.email,
          handicap: editUserForm.handicap,
          city: editUserForm.city,
          country: editUserForm.country,
          isAdmin: editUserForm.isAdmin,
          password: editUserForm.password || undefined
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'User updated successfully' });
        fetchUsers();
        setEditUserDialogOpen(false);
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveHolesEdit = async () => {
    if (!selectedCourse) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/courses/${selectedCourse.id}/holes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holes: editedHoles })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Holes updated successfully' });
        fetchCourses();
      } else {
        throw new Error('Failed to update holes');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update holes', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (course: GolfCourse) => {
    if (!confirm(`Are you sure you want to delete "${course.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${course.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Success', description: 'Course deleted successfully' });
        fetchCourses();
        setSelectedCourse(null);
      } else {
        throw new Error('Failed to delete course');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete course', variant: 'destructive' });
    }
  };

  const deleteUser = async (user: AppUser) => {
    if (!confirm(`Are you sure you want to delete user "${user.email}"? This will also delete all their rounds and favorites. This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Success', description: 'User deleted successfully' });
        fetchUsers();
        setSelectedUser(null);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message || 'Failed to delete user', variant: 'destructive' });
    }
  };

  const toggleUserBlock = async (user: AppUser) => {
    const action = user.blocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} user "${user.email}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !user.blocked })
      });
      
      if (response.ok) {
        toast({ title: 'Success', description: `User ${action}ed successfully` });
        fetchUsers();
      } else {
        throw new Error(`Failed to ${action} user`);
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message || `Failed to ${action} user`, variant: 'destructive' });
    }
  };

  const toggleUserHidden = async (user: AppUser) => {
    const action = user.hiddenFromGolfers ? 'show' : 'hide';
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenFromGolfers: !user.hiddenFromGolfers })
      });
      
      if (response.ok) {
        toast({ title: 'Success', description: `User ${action}n from Golfers list` });
        fetchUsers();
      } else {
        throw new Error(`Failed to ${action} user from Golfers`);
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message || `Failed to update user visibility`, variant: 'destructive' });
    }
  };

  const addNewCourse = async () => {
    try {
      setSaving(true);
      const defaultPars = [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5];
      const handicaps = [1, 10, 3, 12, 5, 14, 7, 16, 9, 2, 11, 4, 13, 6, 15, 8, 17, 18];
      const totalHoles = parseInt(newCourseForm.totalHoles) || 18;
      
      const holes: { holeNumber: number; par: number; handicap: number }[] = [];
      for (let i = 0; i < totalHoles; i++) {
        holes.push({
          holeNumber: i + 1,
          par: defaultPars[i % 18],
          handicap: handicaps[i % 18]
        });
      }

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCourseForm.name,
          city: newCourseForm.city,
          region: newCourseForm.region,
          country: newCourseForm.country,
          latitude: parseFloat(newCourseForm.latitude) || 0,
          longitude: parseFloat(newCourseForm.longitude) || 0,
          totalHoles: totalHoles,
          description: newCourseForm.description,
          designer: newCourseForm.designer,
          yearBuilt: parseInt(newCourseForm.yearBuilt) || null,
          phone: newCourseForm.phone,
          website: newCourseForm.website,
          address: newCourseForm.address,
          holes
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Course added successfully' });
        fetchCourses();
        setAddCourseDialogOpen(false);
        setNewCourseForm({
          name: '', city: '', region: '', country: 'Morocco', latitude: '', longitude: '',
          totalHoles: '18', description: '', designer: '', yearBuilt: '', phone: '', website: '', address: ''
        });
      } else {
        throw new Error('Failed to add course');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add course', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateHole = (index: number, field: 'par' | 'handicap' | 'greenLatitude' | 'greenLongitude', value: number | null) => {
    const updated = [...editedHoles];
    updated[index] = { ...updated[index], [field]: value };
    setEditedHoles(updated);
  };

  // Capture current GPS location for a hole's green
  const captureCurrentLocation = (index: number) => {
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const updated = [...editedHoles];
        updated[index] = { 
          ...updated[index], 
          greenLatitude: latitude, 
          greenLongitude: longitude 
        };
        setEditedHoles(updated);
        toast({
          title: 'Location Captured',
          description: `Green coordinates set: ${latitude.toFixed(8)}, ${longitude.toFixed(8)}`
        });
      },
      (error) => {
        toast({
          title: 'Error',
          description: 'Unable to capture location. Please enable location services.',
          variant: 'destructive'
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Parse GPS coordinates from string "lat, lng" format
  const parseGPSCoordinates = (index: number, value: string) => {
    const parts = value.split(',').map(s => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const updated = [...editedHoles];
        updated[index] = { 
          ...updated[index], 
          greenLatitude: lat, 
          greenLongitude: lng 
        };
        setEditedHoles(updated);
      }
    }
  };

  // Format GPS coordinates for display
  const formatGPS = (hole: CourseHole) => {
    if (hole.greenLatitude !== null && hole.greenLatitude !== undefined && 
        hole.greenLongitude !== null && hole.greenLongitude !== undefined) {
      return `${hole.greenLatitude.toFixed(8)}, ${hole.greenLongitude.toFixed(8)}`;
    }
    return '';
  };

  const calculateTotalPar = (holes: CourseHole[]) => holes.reduce((sum, hole) => sum + hole.par, 0);

  // Auth checking
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, #d6e4ef, white, #d4f5f5)'}}>
        <Loader2 className="h-8 w-8 animate-spin" style={{color: '#39638b'}} />
      </div>
    );
  }

  // Not authorized screen (not an admin user)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(to bottom right, #d6e4ef, white, #d4f5f5)'}}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Admin Access Required</CardTitle>
            <CardDescription>You need to be logged in as an admin user to access this page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/" className="block">
              <Button className="w-full text-white" style={{backgroundColor: '#39638b'}}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to App
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-gradient-to-br from-jazel-50 via-white to-jazel-teal-50">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to App</span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-bold">Setup</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleBackToApp} style={{color: '#39638b'}}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to App
          </Button>
        </div>
      </header>

      <main className="container px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-xl">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="holes">Holes</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={addCourseDialogOpen} onOpenChange={setAddCourseDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Add Course</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Golf Course</DialogTitle>
                    <DialogDescription>Add a new golf course to the database</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Course Name *</Label>
                        <Input id="name" value={newCourseForm.name} onChange={(e) => setNewCourseForm({ ...newCourseForm, name: e.target.value })} placeholder="e.g., Royal Golf Dar Es Salam" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" value={newCourseForm.city} onChange={(e) => setNewCourseForm({ ...newCourseForm, city: e.target.value })} placeholder="e.g., Rabat" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="region">Region</Label>
                        <Input id="region" value={newCourseForm.region} onChange={(e) => setNewCourseForm({ ...newCourseForm, region: e.target.value })} placeholder="e.g., Rabat-Salé-Kénitra" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" value={newCourseForm.country} onChange={(e) => setNewCourseForm({ ...newCourseForm, country: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input id="latitude" type="number" step="any" value={newCourseForm.latitude} onChange={(e) => setNewCourseForm({ ...newCourseForm, latitude: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input id="longitude" type="number" step="any" value={newCourseForm.longitude} onChange={(e) => setNewCourseForm({ ...newCourseForm, longitude: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalHoles">Total Holes</Label>
                        <Input id="totalHoles" type="number" value={newCourseForm.totalHoles} onChange={(e) => setNewCourseForm({ ...newCourseForm, totalHoles: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" value={newCourseForm.description} onChange={(e) => setNewCourseForm({ ...newCourseForm, description: e.target.value })} rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="designer">Designer</Label>
                        <Input id="designer" value={newCourseForm.designer} onChange={(e) => setNewCourseForm({ ...newCourseForm, designer: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yearBuilt">Year Built</Label>
                        <Input id="yearBuilt" type="number" value={newCourseForm.yearBuilt} onChange={(e) => setNewCourseForm({ ...newCourseForm, yearBuilt: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={newCourseForm.phone} onChange={(e) => setNewCourseForm({ ...newCourseForm, phone: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" value={newCourseForm.website} onChange={(e) => setNewCourseForm({ ...newCourseForm, website: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" value={newCourseForm.address} onChange={(e) => setNewCourseForm({ ...newCourseForm, address: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddCourseDialogOpen(false)}>Cancel</Button>
                    <Button onClick={addNewCourse} disabled={saving || !newCourseForm.name || !newCourseForm.city}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Course
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{course.name}</CardTitle>
                          <CardDescription>{course.city}, {course.region}</CardDescription>
                        </div>
                        <Badge variant="outline">{course.totalHoles} holes</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {course.designer && <p className="text-sm text-muted-foreground">Designer: {course.designer}</p>}
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">Par {calculateTotalPar(course.holes)}</Badge>
                        {course.yearBuilt && <Badge variant="outline">{course.yearBuilt}</Badge>}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(course)}>
                          <Edit2 className="mr-1 h-3 w-3" />Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openHolesEditDialog(course)}>
                          <ChevronRight className="mr-1 h-3 w-3" />Holes
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteCourse(course)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="holes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Edit Holes</CardTitle>
                <CardDescription>Select a course to edit hole pars and handicaps</CardDescription>
              </CardHeader>
              <CardContent>
                <Select onValueChange={(value) => {
                  const course = courses.find(c => c.id === value);
                  if (course) { setSelectedCourse(course); setEditedHoles([...course.holes]); }
                }}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>{course.name} - {course.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedCourse && editedHoles.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedCourse.name}</CardTitle>
                      <CardDescription>Total Par: {calculateTotalPar(editedHoles)}</CardDescription>
                    </div>
                    <Button onClick={saveHolesEdit} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold mb-3">Front 9 (Par {editedHoles.slice(0, 9).reduce((sum, h) => sum + h.par, 0)})</h3>
                      <div className="space-y-2">
                        {editedHoles.slice(0, 9).map((hole, index) => (
                          <div key={hole.id} className="p-2 rounded-lg bg-muted/50 space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="w-8 text-center font-medium">#{hole.holeNumber}</span>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">Par</Label>
                                <Select value={hole.par.toString()} onValueChange={(value) => updateHole(index, 'par', parseInt(value))}>
                                  <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">HCP</Label>
                                <Input type="number" min={1} max={18} value={hole.handicap} onChange={(e) => updateHole(index, 'handicap', parseInt(e.target.value) || 1)} className="w-16" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pl-8">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="31.601578, -8.007917"
                                value={formatGPS(hole)}
                                onChange={(e) => parseGPSCoordinates(index, e.target.value)}
                                className="flex-1 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => captureCurrentLocation(index)}
                                title="Use my current location for green center"
                              >
                                <Crosshair className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {editedHoles.length > 9 && (
                      <div>
                        <h3 className="font-semibold mb-3">Back 9 (Par {editedHoles.slice(9, 18).reduce((sum, h) => sum + h.par, 0)})</h3>
                        <div className="space-y-2">
                          {editedHoles.slice(9, 18).map((hole, index) => (
                            <div key={hole.id} className="p-2 rounded-lg bg-muted/50 space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="w-8 text-center font-medium">#{hole.holeNumber}</span>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground">Par</Label>
                                  <Select value={hole.par.toString()} onValueChange={(value) => updateHole(index + 9, 'par', parseInt(value))}>
                                    <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="3">3</SelectItem>
                                      <SelectItem value="4">4</SelectItem>
                                      <SelectItem value="5">5</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground">HCP</Label>
                                  <Input type="number" min={1} max={18} value={hole.handicap} onChange={(e) => updateHole(index + 9, 'handicap', parseInt(e.target.value) || 1)} className="w-16" />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pl-8">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <Input
                                  placeholder="31.601578, -8.007917"
                                  value={formatGPS(hole)}
                                  onChange={(e) => parseGPSCoordinates(index + 9, e.target.value)}
                                  className="flex-1 text-xs"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => captureCurrentLocation(index + 9)}
                                  title="Use my current location for green center"
                                >
                                  <Crosshair className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Registered Users
                    </CardTitle>
                    <CardDescription>Manage user accounts ({users.length} total)</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-7 gap-4 p-3 bg-muted/50 text-sm font-medium">
                    <div>Name</div>
                    <div>HCP</div>
                    <div>Rds</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>Golfers</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <div className="divide-y max-h-96 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="p-3 text-sm">
                        <div className="grid grid-cols-7 gap-4 items-center">
                          <div className="truncate font-medium">{user.name || '-'}</div>
                          <div>{user.handicap || '-'}</div>
                          <div>{user._count.rounds}</div>
                          <div>
                            <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                              {user.isAdmin ? 'Admin' : 'User'}
                            </Badge>
                          </div>
                          <div>
                            <Badge variant={user.blocked ? 'destructive' : 'outline'}>
                              {user.blocked ? 'Blocked' : 'Active'}
                            </Badge>
                          </div>
                          <div>
                            <Badge variant={user.hiddenFromGolfers ? 'secondary' : 'outline'}>
                              {user.hiddenFromGolfers ? 'Hidden' : 'Visible'}
                            </Badge>
                          </div>
                          <div></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={user.blocked ? 'text-green-600 hover:text-green-700' : 'text-amber-600 hover:text-amber-700'}
                            onClick={() => toggleUserBlock(user)}
                            title={user.blocked ? 'Unblock user' : 'Block user'}
                          >
                            {user.blocked ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className={user.hiddenFromGolfers ? 'text-red-600 hover:text-red-700' : 'text-slate-600 hover:text-slate-700'}
                            onClick={() => toggleUserHidden(user)}
                            title={user.hiddenFromGolfers ? 'Show in Golfers' : 'Hide from Golfers'}
                          >
                            {user.hiddenFromGolfers ? (
                              <EyeOff className="h-4 w-4 text-red-500" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openUserEditDialog(user)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => deleteUser(user)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">No users found</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Create New Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Send New Message
                  </CardTitle>
                  <CardDescription>Send a message to all users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="messageTitle">Title</Label>
                    <Input
                      id="messageTitle"
                      placeholder="Message title..."
                      value={newMessageTitle}
                      onChange={(e) => setNewMessageTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="messageContent">Content</Label>
                    <Textarea
                      id="messageContent"
                      placeholder="Write your message here..."
                      value={newMessageContent}
                      onChange={(e) => setNewMessageContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <Button 
                    onClick={createMessage} 
                    disabled={messagesLoading || !newMessageTitle.trim() || !newMessageContent.trim()}
                    className="w-full text-white"
                    style={{backgroundColor: '#39638b'}}
                  >
                    {messagesLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Send Message
                  </Button>
                </CardContent>
              </Card>

              {/* Previous Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Previous Messages
                  </CardTitle>
                  <CardDescription>{messages.length} messages sent</CardDescription>
                </CardHeader>
                <CardContent>
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" style={{color: '#39638b'}} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No messages sent yet
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className="p-3 rounded-lg border"
                          style={{borderColor: '#8ab0d1'}}
                        >
                          {editingMessage?.id === msg.id ? (
                            <div className="space-y-3">
                              <Input
                                value={editingMessage.title}
                                onChange={(e) => setEditingMessage({ ...editingMessage, title: e.target.value })}
                                placeholder="Title"
                              />
                              <Textarea
                                value={editingMessage.content}
                                onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                                placeholder="Content"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={updateMessage} className="text-white" style={{backgroundColor: '#39638b'}}>
                                  <Save className="mr-1 h-3 w-3" /> Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingMessage(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="font-medium">{msg.title}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{msg.content}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{borderColor: '#e5e7eb'}}>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(msg.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setEditingMessage({ id: msg.id, title: msg.title, content: msg.content })}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => deleteMessage(msg.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  App Settings
                </CardTitle>
                <CardDescription>Configure application settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxDistance">Max Nearby Distance (km)</Label>
                    <p className="text-sm text-muted-foreground">
                      Maximum distance to show courses when using "Near Me" feature
                    </p>
                    <Input
                      id="maxDistance"
                      type="number"
                      min={1}
                      max={500}
                      value={maxNearbyDistance}
                      onChange={(e) => setMaxNearbyDistance(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  
                  <Button 
                    onClick={saveSettings} 
                    disabled={settingsLoading}
                    className="w-fit"
                  >
                    {settingsLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update course information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course Name *</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Region</Label>
                <Input value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input type="number" step="any" value={editForm.latitude} onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input type="number" step="any" value={editForm.longitude} onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Total Holes</Label>
                <Input type="number" value={editForm.totalHoles} onChange={(e) => setEditForm({ ...editForm, totalHoles: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Designer</Label>
                <Input value={editForm.designer} onChange={(e) => setEditForm({ ...editForm, designer: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Year Built</Label>
                <Input type="number" value={editForm.yearBuilt} onChange={(e) => setEditForm({ ...editForm, yearBuilt: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCourseEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user account information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editUserForm.name} onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Handicap</Label>
              <Input type="number" step="0.1" value={editUserForm.handicap} onChange={(e) => setEditUserForm({ ...editUserForm, handicap: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={editUserForm.city} onChange={(e) => setEditUserForm({ ...editUserForm, city: e.target.value })} placeholder="e.g., Casablanca" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={editUserForm.country} onChange={(e) => setEditUserForm({ ...editUserForm, country: e.target.value })} placeholder="e.g., Morocco" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password (leave blank to keep current)</Label>
              <Input type="password" placeholder="••••••••" value={editUserForm.password} onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isAdmin">Admin Role</Label>
              <Switch id="isAdmin" checked={editUserForm.isAdmin} onCheckedChange={(checked) => setEditUserForm({ ...editUserForm, isAdmin: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveUserEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
