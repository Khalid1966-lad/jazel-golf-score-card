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
  Mail,
  Trophy,
  Calendar,
  Clock,
  UserPlus,
  Download,
  UserCircle,
  Database,
  Upload,
  AlertTriangle,
  UserCog,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

// Super Admin emails - these users cannot have their admin status changed
const SUPER_ADMIN_EMAILS = [
  'kbelkhalfi@gmail.com',
  'contact@jazelwebagency.com',
];

const isSuperAdmin = (email: string | null) => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
};

// Check if admin can edit a course (super admin or assigned to them)
const canEditCourse = (course: { adminId: string | null }, userEmail: string | null, userId: string | null) => {
  if (isSuperAdmin(userEmail)) return true;
  return course.adminId === userId;
};

interface CourseHole {
  id: string;
  holeNumber: number;
  par: number;
  handicap: number;
  teeLatitude?: number | null;
  teeLongitude?: number | null;
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
  isActive: boolean;
  adminId: string | null;
  assignedAdmin?: { id: string; name: string | null; email: string } | null;
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

interface Tournament {
  id: string;
  name: string;
  courseId: string;
  date: string;
  startTime: string;
  format: string;
  maxPlayers: number;
  notes: string | null;
  status: string;
  createdAt: string;
  course: {
    id: string;
    name: string;
    city: string;
  };
  _count?: {
    participants: number;
  };
  participants?: Array<{
    userId: string;
    grossScore: number | null;
    netScore: number | null;
    groupLetter: string | null;
    positionInGroup: number | null;
    teeTime: string | null;
    user: {
      id: string;
      name: string | null;
      handicap: number | null;
    };
  }>;
}

interface TournamentParticipant {
  userId: string;
  tournamentId: string;
  grossScore: number | null;
  netScore: number | null;
  groupLetter: string | null;
  positionInGroup: number | null;
  teeTime: string | null;
  user: {
    id: string;
    name: string | null;
    handicap: number | null;
  };
}

interface GolferGroup {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
  members?: Array<{
    id: string;
    userId: string;
    joinedAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      handicap: number | null;
      city: string | null;
      country: string | null;
      avatar: string | null;
    };
  }>;
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
  
  // Tournament state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [addTournamentDialogOpen, setAddTournamentDialogOpen] = useState(false);
  const [editTournamentDialogOpen, setEditTournamentDialogOpen] = useState(false);
  const [tournamentSearchQuery, setTournamentSearchQuery] = useState('');
  const [newTournamentForm, setNewTournamentForm] = useState({
    name: '',
    courseId: '',
    date: '',
    startTime: '08:00',
    format: 'Stroke Play',
    maxPlayers: 144,
    notes: ''
  });
  const [editTournamentForm, setEditTournamentForm] = useState({
    name: '',
    courseId: '',
    date: '',
    startTime: '08:00',
    format: 'Stroke Play',
    maxPlayers: 144,
    notes: '',
    status: 'upcoming'
  });
  const [participantSort, setParticipantSort] = useState<'handicap' | 'gross' | 'net'>('handicap');
  const [addParticipantDialogOpen, setAddParticipantDialogOpen] = useState(false);
  
  // Tournament Groups state
  const [tournamentViewTab, setTournamentViewTab] = useState<'leaderboard' | 'groups'>('leaderboard');
  const [groupsData, setGroupsData] = useState<{
    groups: Record<string, TournamentParticipant[]>;
    unassigned: TournamentParticipant[];
  }>({ groups: {}, unassigned: [] });
  const [tournamentGroupsLoading, setTournamentGroupsLoading] = useState(false);
  const [assignPlayerDialogOpen, setAssignPlayerDialogOpen] = useState(false);
  const [selectedGroupLetter, setSelectedGroupLetter] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [teeTimeForm, setTeeTimeForm] = useState({ startTime: '08:00', interval: 10 });
  
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
    address: '',
    isActive: true,
    adminId: '' as string | null
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
    address: '',
    isActive: true
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
    targetType: string;
    targetId: string | null;
    targetName: string | null;
    readCount: number;
  }>>([]);
  const [newMessageTitle, setNewMessageTitle] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [editingMessage, setEditingMessage] = useState<{ id: string; title: string; content: string } | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Groups state
  const [groups, setGroups] = useState<GolferGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GolferGroup | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({ name: '', description: '' });
  const [editGroupForm, setEditGroupForm] = useState({ id: '', name: '', description: '' });
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [messageTargetType, setMessageTargetType] = useState<'all' | 'group' | 'user'>('all');
  const [messageTargetId, setMessageTargetId] = useState<string>('');

  // Backup & Restore state
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);

  // Course Backup & Restore state
  const [courseBackupLoading, setCourseBackupLoading] = useState(false);
  const [courseRestoreLoading, setCourseRestoreLoading] = useState(false);
  const [selectedCourseBackupFile, setSelectedCourseBackupFile] = useState<File | null>(null);

  // Admin permissions state
  const [adminPermissions, setAdminPermissions] = useState<{
    isSuperAdmin: boolean;
    permissions: {
      canViewCourses: boolean;
      canViewUsers: boolean;
      canViewTournaments: boolean;
      canViewGroups: boolean;
      canViewMessages: boolean;
      canViewSettings: boolean;
      canViewBackup: boolean;
    };
  } | null>(null);

  // Admin permissions management state (for super admins)
  const [adminUsers, setAdminUsers] = useState<Array<{
    id: string;
    email: string;
    name: string | null;
    adminPermission: {
      canViewCourses: boolean;
      canViewUsers: boolean;
      canViewTournaments: boolean;
      canViewGroups: boolean;
      canViewMessages: boolean;
      canViewSettings: boolean;
      canViewBackup: boolean;
    } | null;
  }>>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

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

  // Fetch courses - use admin-specific endpoint for permission filtering
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data || []);
      } else {
        console.error('Failed to fetch admin courses:', response.status);
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
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

  // Fetch groups
  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await fetch('/api/admin/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCourses();
      fetchSettings();
      fetchUsers();
      fetchMessages();
      fetchTournaments();
      fetchGroups();
      fetchAdminPermissions();
    }
  }, [isAuthenticated]);

  // Fetch admin permissions
  const fetchAdminPermissions = async () => {
    try {
      console.log('Fetching admin permissions...');
      const response = await fetch('/api/admin/permissions/me');
      console.log('Admin permissions response:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Admin permissions data:', data);
        setAdminPermissions(data);
      }
    } catch (error) {
      console.error('Error fetching admin permissions:', error);
    }
  };

  // Fetch admin users when we have super admin permissions
  useEffect(() => {
    if (adminPermissions?.isSuperAdmin) {
      fetchAdminUsers();
    }
  }, [adminPermissions?.isSuperAdmin]);

  // Fetch groups data when tournament is selected and tab is groups
  useEffect(() => {
    if (selectedTournament && tournamentViewTab === 'groups') {
      fetchGroupsData(selectedTournament.id);
    }
  }, [selectedTournament?.id, tournamentViewTab]);

  // Fetch admin users for permissions management (super admin only)
  const fetchAdminUsers = async () => {
    try {
      setPermissionsLoading(true);
      console.log('Fetching admin users...');
      const response = await fetch('/api/admin/permissions');
      console.log('Admin users response status:', response.status);
      const data = await response.json();
      console.log('Admin users data:', data);
      if (response.ok) {
        setAdminUsers(data.admins || []);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Update admin permissions
  const updateAdminPermission = async (userId: string, permissions: {
    canViewCourses: boolean;
    canViewUsers: boolean;
    canViewTournaments: boolean;
    canViewGroups: boolean;
    canViewMessages: boolean;
    canViewSettings: boolean;
    canViewBackup: boolean;
  }) => {
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, permissions })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Permissions updated successfully' });
        fetchAdminUsers();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update permissions');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to update permissions',
        variant: 'destructive'
      });
    }
  };

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

  // Handle backup download
  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      
      const response = await fetch('/api/admin/backup');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create backup');
      }
      
      // Get the JSON data
      const data = await response.json();
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jazel-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Success', description: 'Database backup downloaded successfully' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to create backup', variant: 'destructive' });
    } finally {
      setBackupLoading(false);
    }
  };

  // Handle file selection for restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedBackupFile(file);
    }
  };

  // Handle restore upload
  const handleRestore = async () => {
    if (!selectedBackupFile) return;
    
    // Confirm before restore
    if (!confirm('Are you sure you want to restore the database? This will replace ALL existing data. This action cannot be undone.')) {
      return;
    }
    
    try {
      setRestoreLoading(true);
      
      // Read the file
      const fileContent = await selectedBackupFile.text();
      
      // Debug: log the backup file structure
      try {
        const parsedBackup = JSON.parse(fileContent);
        console.log('Backup file keys:', Object.keys(parsedBackup));
        console.log('Backup data keys:', parsedBackup.data ? Object.keys(parsedBackup.data) : 'No data');
        console.log('Backup statistics:', parsedBackup.statistics);
      } catch (e) {
        console.error('Could not parse backup file for debugging');
      }
      
      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: fileContent
      });
      
      const result = await response.json();
      console.log('Restore result:', result);
      
      if (response.ok) {
        const { results } = result;
        let description = `${results?.totalRecords || 0} records imported across ${results?.tablesImported || 0} tables.`;
        
        if (results?.errors > 0) {
          description += ` ${results.errors} error(s).`;
        }
        if (results?.filteredFields?.length > 0) {
          description += ` Some fields were filtered due to schema changes.`;
        }
        
        toast({ 
          title: results?.totalRecords > 0 ? 'Success' : 'Warning', 
          description 
        });
        // Refresh data
        fetchCourses();
        fetchUsers();
        fetchTournaments();
        fetchGroups();
        fetchMessages();
        setSelectedBackupFile(null);
        // Reset file input
        const fileInput = document.getElementById('restoreFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result.error || 'Failed to restore database');
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to restore database', 
        variant: 'destructive' 
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  // Handle course backup download
  const handleCourseBackup = async () => {
    try {
      setCourseBackupLoading(true);
      
      const response = await fetch('/api/admin/courses/backup');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create courses backup');
      }
      
      // Get the JSON data
      const data = await response.json();
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jazel-courses-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Success', description: 'Golf courses backup downloaded successfully' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to create courses backup', variant: 'destructive' });
    } finally {
      setCourseBackupLoading(false);
    }
  };

  // Handle file selection for course restore
  const handleCourseFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCourseBackupFile(file);
    }
  };

  // Handle course restore upload
  const handleCourseRestore = async () => {
    if (!selectedCourseBackupFile) return;
    
    // Confirm before restore
    if (!confirm('Are you sure you want to restore golf courses? This will replace ALL existing courses, holes, tees, and distances. This action cannot be undone.')) {
      return;
    }
    
    try {
      setCourseRestoreLoading(true);
      
      // Read the file
      const fileContent = await selectedCourseBackupFile.text();
      
      const response = await fetch('/api/admin/courses/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: fileContent
      });
      
      const result = await response.json();
      
      if (response.ok) {
        const { results } = result;
        let description = `${results?.totalRecords || 0} records imported across ${results?.tablesImported || 0} tables.`;
        
        if (results?.errors > 0) {
          description += ` ${results.errors} error(s).`;
        }
        
        toast({ 
          title: results?.totalRecords > 0 ? 'Success' : 'Warning', 
          description 
        });
        // Refresh data
        fetchCourses();
        setSelectedCourseBackupFile(null);
        // Reset file input
        const fileInput = document.getElementById('courseRestoreFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result.error || 'Failed to restore golf courses');
      }
    } catch (error) {
      console.error('Course restore error:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to restore golf courses', 
        variant: 'destructive' 
      });
    } finally {
      setCourseRestoreLoading(false);
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
          content: newMessageContent,
          targetType: messageTargetType,
          targetId: messageTargetId || undefined
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Message sent successfully' });
        setNewMessageTitle('');
        setNewMessageContent('');
        setMessageTargetType('all');
        setMessageTargetId('');
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

  // Groups functions
  const createGroup = async () => {
    if (!newGroupForm.name.trim()) {
      toast({ title: 'Error', description: 'Group name is required', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroupForm)
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Group created successfully' });
        fetchGroups();
        setAddGroupDialogOpen(false);
        setNewGroupForm({ name: '', description: '' });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create group');
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message || 'Failed to create group', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateGroup = async () => {
    if (!editGroupForm.name.trim()) {
      toast({ title: 'Error', description: 'Group name is required', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/groups?id=${editGroupForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editGroupForm.name, description: editGroupForm.description })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Group updated successfully' });
        fetchGroups();
        setEditGroupDialogOpen(false);
        setEditGroupForm({ id: '', name: '', description: '' });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update group');
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message || 'Failed to update group', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Members will be removed.')) return;

    try {
      const response = await fetch(`/api/admin/groups?id=${groupId}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Success', description: 'Group deleted successfully' });
        fetchGroups();
        setSelectedGroup(null);
      } else {
        throw new Error('Failed to delete group');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete group', variant: 'destructive' });
    }
  };

  const fetchGroupWithMembers = async (groupId: string) => {
    try {
      setGroupsLoading(true);
      const response = await fetch(`/api/admin/groups?id=${groupId}&includeMembers=true`);
      if (response.ok) {
        const data = await response.json();
        setSelectedGroup(data.group);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
    } finally {
      setGroupsLoading(false);
    }
  };

  const addMemberToGroup = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      const response = await fetch('/api/admin/groups/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: selectedGroup.id, userId })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Member added successfully' });
        fetchGroupWithMembers(selectedGroup.id);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add member');
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message || 'Failed to add member', variant: 'destructive' });
    }
  };

  const removeMemberFromGroup = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      const response = await fetch(`/api/admin/groups/members?groupId=${selectedGroup.id}&userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Member removed successfully' });
        fetchGroupWithMembers(selectedGroup.id);
      } else {
        throw new Error('Failed to remove member');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' });
    }
  };

  const getUsersNotInGroup = () => {
    if (!selectedGroup?.members) return users.filter(u => !u.hiddenFromGolfers);
    const memberIds = selectedGroup.members.map(m => m.userId);
    return users.filter(u => !memberIds.includes(u.id) && !u.hiddenFromGolfers);
  };

  // Get recipient display name for messages
  const getRecipientDisplay = (targetType: string, targetId: string | null, targetName: string | null) => {
    if (targetType === 'all') {
      return 'All Golfers';
    }
    if (targetType === 'group') {
      return targetName ? `Group: ${targetName}` : 'Unknown Group';
    }
    if (targetType === 'user') {
      return targetName ? `Player: ${targetName}` : 'Unknown Player';
    }
    return 'Unknown';
  };

  const filteredCourses = courses
    .filter(course =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.region.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort active courses first
      if (a.isActive === b.isActive) return 0;
      return a.isActive ? -1 : 1;
    });

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
      address: course.address || '',
      isActive: course.isActive ?? true,
      adminId: course.adminId || null
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
      const response = await fetch(`/api/admin/courses/${selectedCourse.id}`, {
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
          address: editForm.address,
          isActive: editForm.isActive,
          adminId: editForm.adminId || null
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Course updated successfully' });
        fetchCourses();
        setEditDialogOpen(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update course');
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message || 'Failed to update course', variant: 'destructive' });
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
      const response = await fetch(`/api/admin/courses/${selectedCourse.id}/holes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holes: editedHoles })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Holes updated successfully' });
        fetchCourses();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update holes');
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message || 'Failed to update holes', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (course: GolfCourse) => {
    if (!confirm(`Are you sure you want to delete "${course.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Success', description: 'Course deleted successfully' });
        fetchCourses();
        setSelectedCourse(null);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete course');
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message || 'Failed to delete course', variant: 'destructive' });
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

      const response = await fetch('/api/admin/courses', {
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
          isActive: newCourseForm.isActive,
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
          totalHoles: '18', description: '', designer: '', yearBuilt: '', phone: '', website: '', address: '', isActive: true
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add course');
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message || 'Failed to add course', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateHole = (index: number, field: 'par' | 'handicap' | 'teeLatitude' | 'teeLongitude' | 'greenLatitude' | 'greenLongitude', value: number | null) => {
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

  // Format Tee GPS coordinates for display
  const formatTeeGPS = (hole: CourseHole) => {
    if (hole.teeLatitude !== null && hole.teeLatitude !== undefined && 
        hole.teeLongitude !== null && hole.teeLongitude !== undefined) {
      return `${hole.teeLatitude.toFixed(8)}, ${hole.teeLongitude.toFixed(8)}`;
    }
    return '';
  };

  // Capture current GPS location for a hole's tee
  const captureTeeLocation = (index: number) => {
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
          teeLatitude: latitude, 
          teeLongitude: longitude 
        };
        setEditedHoles(updated);
        toast({
          title: 'Location Captured',
          description: `Tee coordinates set: ${latitude.toFixed(8)}, ${longitude.toFixed(8)}`
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

  // Parse Tee GPS coordinates from string "lat, lng" format
  const parseTeeGPSCoordinates = (index: number, value: string) => {
    const parts = value.split(',').map(s => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const updated = [...editedHoles];
        updated[index] = { 
          ...updated[index], 
          teeLatitude: lat, 
          teeLongitude: lng 
        };
        setEditedHoles(updated);
      }
    }
  };

  const calculateTotalPar = (holes: CourseHole[]) => holes.reduce((sum, hole) => sum + hole.par, 0);

  // Fetch tournaments
  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  // Select tournament and fetch participants
  const selectTournamentWithParticipants = async (tournament: Tournament) => {
    try {
      const response = await fetch(`/api/tournaments?id=${tournament.id}&includeParticipants=true`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTournament(data.tournament);
      } else {
        // Fallback to basic tournament data
        setSelectedTournament(tournament);
      }
    } catch (error) {
      console.error('Error fetching tournament participants:', error);
      setSelectedTournament(tournament);
    }
  };

  // Create tournament
  const createTournament = async () => {
    if (!newTournamentForm.name || !newTournamentForm.courseId || !newTournamentForm.date) {
      toast({ title: 'Error', description: 'Name, course, and date are required', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTournamentForm.name,
          courseId: newTournamentForm.courseId,
          date: newTournamentForm.date,
          startTime: newTournamentForm.startTime,
          format: newTournamentForm.format,
          maxPlayers: newTournamentForm.maxPlayers,
          notes: newTournamentForm.notes || null
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Tournament created successfully' });
        fetchTournaments();
        setAddTournamentDialogOpen(false);
        setNewTournamentForm({
          name: '',
          courseId: '',
          date: '',
          startTime: '08:00',
          format: 'Stroke Play',
          maxPlayers: 144,
          notes: ''
        });
      } else {
        throw new Error('Failed to create tournament');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create tournament', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Update tournament
  const updateTournament = async () => {
    if (!selectedTournament) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/tournaments?id=${selectedTournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTournamentForm.name,
          courseId: editTournamentForm.courseId,
          date: editTournamentForm.date,
          startTime: editTournamentForm.startTime,
          format: editTournamentForm.format,
          maxPlayers: editTournamentForm.maxPlayers,
          notes: editTournamentForm.notes || null,
          status: editTournamentForm.status
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Tournament updated successfully' });
        fetchTournaments();
        setEditTournamentDialogOpen(false);
        setSelectedTournament(null);
      } else {
        throw new Error('Failed to update tournament');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update tournament', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete tournament
  const deleteTournament = async (tournament: Tournament) => {
    if (!confirm(`Are you sure you want to delete "${tournament.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tournaments?id=${tournament.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Success', description: 'Tournament deleted successfully' });
        fetchTournaments();
        setSelectedTournament(null);
      } else {
        throw new Error('Failed to delete tournament');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete tournament', variant: 'destructive' });
    }
  };

  // Add participant to tournament
  const addParticipant = async (userId: string) => {
    if (!selectedTournament) return;

    if (!userId) {
      toast({ title: 'Error', description: 'Please select a user', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch('/api/tournaments/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          userId
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Participant added successfully' });
        setAddParticipantDialogOpen(false);
        // Refresh tournament data with participants
        const tournResponse = await fetch(`/api/tournaments?id=${selectedTournament.id}&includeParticipants=true`);
        if (tournResponse.ok) {
          const data = await tournResponse.json();
          if (data.tournament) {
            setSelectedTournament(data.tournament);
            // Also update the tournaments list
            setTournaments(prev => prev.map(t => t.id === data.tournament.id ? data.tournament : t));
          }
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add participant');
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message || 'Failed to add participant', variant: 'destructive' });
    }
  };

  // Remove participant from tournament
  const removeParticipant = async (userId: string) => {
    if (!selectedTournament) return;

    try {
      const response = await fetch(`/api/tournaments/participants?tournamentId=${selectedTournament.id}&userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Participant removed successfully' });
        // Refresh tournament data with participants
        const tournResponse = await fetch(`/api/tournaments?id=${selectedTournament.id}&includeParticipants=true`);
        if (tournResponse.ok) {
          const data = await tournResponse.json();
          if (data.tournament) {
            setSelectedTournament(data.tournament);
            // Also update the tournaments list
            setTournaments(prev => prev.map(t => t.id === data.tournament.id ? data.tournament : t));
          }
        }
      } else {
        throw new Error('Failed to remove participant');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove participant', variant: 'destructive' });
    }
  };

  // Update participant scores
  const updateParticipantScore = async (userId: string, grossScore: number | null, netScore: number | null) => {
    if (!selectedTournament) return;

    try {
      const response = await fetch('/api/tournaments/participants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          userId,
          grossScore,
          netScore
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Score updated successfully' });
        // Refresh tournament data
        const tournResponse = await fetch(`/api/tournaments?id=${selectedTournament.id}&includeParticipants=true`);
        if (tournResponse.ok) {
          const data = await tournResponse.json();
          setSelectedTournament(data.tournament);
        }
      } else {
        throw new Error('Failed to update score');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update score', variant: 'destructive' });
    }
  };

  // Fetch groups data
  const fetchGroupsData = async (tournamentId: string) => {
    setTournamentGroupsLoading(true);
    try {
      const response = await fetch(`/api/tournaments/groups?tournamentId=${tournamentId}`);
      if (response.ok) {
        const data = await response.json();
        setGroupsData({ groups: data.groups, unassigned: data.unassigned });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch groups data', variant: 'destructive' });
    } finally {
      setTournamentGroupsLoading(false);
    }
  };

  // Auto-assign players to groups
  const autoAssignGroups = async () => {
    if (!selectedTournament) return;
    
    setTournamentGroupsLoading(true);
    try {
      const response = await fetch('/api/tournaments/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          startTime: teeTimeForm.startTime,
          intervalMinutes: teeTimeForm.interval
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: 'Success', description: `${data.assigned} players assigned to groups` });
        await fetchGroupsData(selectedTournament.id);
        // Refresh tournament data
        const tournResponse = await fetch(`/api/tournaments?id=${selectedTournament.id}&includeParticipants=true`);
        if (tournResponse.ok) {
          const tournData = await tournResponse.json();
          setSelectedTournament(tournData.tournament);
        }
      } else {
        throw new Error('Failed to auto-assign groups');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to auto-assign groups', variant: 'destructive' });
    } finally {
      setTournamentGroupsLoading(false);
    }
  };

  // Assign a player to a specific group position
  const assignPlayerToGroup = async (userId: string, groupLetter: string, position: number, teeTime?: string) => {
    if (!selectedTournament) return;
    
    try {
      const response = await fetch('/api/tournaments/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          assignments: [{ userId, groupLetter, positionInGroup: position, teeTime }]
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Player assigned to group' });
        await fetchGroupsData(selectedTournament.id);
        // Refresh tournament data
        const tournResponse = await fetch(`/api/tournaments?id=${selectedTournament.id}&includeParticipants=true`);
        if (tournResponse.ok) {
          const tournData = await tournResponse.json();
          setSelectedTournament(tournData.tournament);
        }
      } else {
        throw new Error('Failed to assign player');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to assign player to group', variant: 'destructive' });
    }
  };

  // Remove player from group
  const removePlayerFromGroup = async (userId: string) => {
    if (!selectedTournament) return;
    
    try {
      const response = await fetch(`/api/tournaments/groups?tournamentId=${selectedTournament.id}&userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Player removed from group' });
        await fetchGroupsData(selectedTournament.id);
        // Refresh tournament data
        const tournResponse = await fetch(`/api/tournaments?id=${selectedTournament.id}&includeParticipants=true`);
        if (tournResponse.ok) {
          const tournData = await tournResponse.json();
          setSelectedTournament(tournData.tournament);
        }
      } else {
        throw new Error('Failed to remove player from group');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove player from group', variant: 'destructive' });
    }
  };

  // Get unassigned participants for dropdown
  const getUnassignedParticipants = () => {
    return groupsData.unassigned;
  };

  // Get all group letters used or available
  const getGroupLetters = () => {
    const letters = Object.keys(groupsData.groups).sort();
    return letters;
  };

  // Get next available group letter
  const getNextGroupLetter = () => {
    const existingLetters = Object.keys(groupsData.groups).sort();
    if (existingLetters.length === 0) return 'A';
    const lastLetter = existingLetters[existingLetters.length - 1];
    return String.fromCharCode(lastLetter.charCodeAt(0) + 1);
  };

  // Add a new empty group
  const addNewGroup = () => {
    const nextLetter = getNextGroupLetter();
    setGroupsData(prev => ({
      ...prev,
      groups: { ...prev.groups, [nextLetter]: [] }
    }));
  };

  // Open edit tournament dialog
  const openTournamentEditDialog = (tournament: Tournament) => {
    setEditTournamentForm({
      name: tournament.name,
      courseId: tournament.courseId,
      date: tournament.date,
      startTime: tournament.startTime,
      format: tournament.format,
      maxPlayers: tournament.maxPlayers,
      notes: tournament.notes || '',
      status: tournament.status
    });
    setSelectedTournament(tournament);
    setEditTournamentDialogOpen(true);
  };

  // Filter tournaments
  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(tournamentSearchQuery.toLowerCase()) ||
    tournament.course.name.toLowerCase().includes(tournamentSearchQuery.toLowerCase())
  );

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Upcoming</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get users not already participants (excluding hidden users)
  const getAvailableUsers = () => {
    // Filter out hidden users first
    const visibleUsers = users.filter(u => !u.hiddenFromGolfers);
    if (!selectedTournament?.participants) return visibleUsers;
    const participantIds = selectedTournament.participants.map(p => p.userId);
    return visibleUsers.filter(u => !participantIds.includes(u.id));
  };

  // Sort participants based on selected sort option
  const getSortedParticipants = () => {
    if (!selectedTournament?.participants) return [];
    const participants = [...selectedTournament.participants];
    
    switch (participantSort) {
      case 'gross':
        // Sort by gross score (nulls last), then by handicap
        return participants.sort((a, b) => {
          if (a.grossScore === null && b.grossScore === null) return (a.user.handicap || 0) - (b.user.handicap || 0);
          if (a.grossScore === null) return 1;
          if (b.grossScore === null) return -1;
          return a.grossScore - b.grossScore;
        });
      case 'net':
        // Sort by net score (nulls last), then by handicap
        return participants.sort((a, b) => {
          if (a.netScore === null && b.netScore === null) return (a.user.handicap || 0) - (b.user.handicap || 0);
          if (a.netScore === null) return 1;
          if (b.netScore === null) return -1;
          return a.netScore - b.netScore;
        });
      case 'handicap':
      default:
        // Sort by handicap (lowest first)
        return participants.sort((a, b) => (a.user.handicap || 0) - (b.user.handicap || 0));
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
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
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/50 rounded-lg border border-jazel-200">
            <TabsTrigger
              value="courses"
              className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
            >Courses</TabsTrigger>
            {(adminPermissions?.isSuperAdmin || adminPermissions?.permissions?.canViewUsers) && (
              <TabsTrigger
                value="users"
                className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >Users</TabsTrigger>
            )}
            {(adminPermissions?.isSuperAdmin || adminPermissions?.permissions?.canViewTournaments) && (
              <TabsTrigger
                value="tournaments"
                className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >Tournaments</TabsTrigger>
            )}
            {(adminPermissions?.isSuperAdmin || adminPermissions?.permissions?.canViewGroups) && (
              <TabsTrigger
                value="groups"
                className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >Groups</TabsTrigger>
            )}
            {(adminPermissions?.isSuperAdmin || adminPermissions?.permissions?.canViewMessages) && (
              <TabsTrigger
                value="messages"
                className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >Messages</TabsTrigger>
            )}
            {(adminPermissions?.isSuperAdmin || adminPermissions?.permissions?.canViewSettings) && (
              <TabsTrigger
                value="settings"
                className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >Settings</TabsTrigger>
            )}
            {(adminPermissions?.isSuperAdmin || adminPermissions?.permissions?.canViewBackup) && (
              <TabsTrigger
                value="backup"
                className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >Backup</TabsTrigger>
            )}
            {adminPermissions?.isSuperAdmin && (
              <TabsTrigger
                value="permissions"
                className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >Permissions</TabsTrigger>
            )}
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
                  <Card key={course.id} className={`overflow-hidden ${!course.isActive ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{course.name}</CardTitle>
                          <CardDescription>{course.city}, {course.region}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={course.isActive ? 'default' : 'destructive'} className={course.isActive ? 'bg-green-600' : ''}>
                            {course.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">{course.totalHoles} holes</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {course.designer && <p className="text-sm text-muted-foreground">Designer: {course.designer}</p>}
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">Par {calculateTotalPar(course.holes)}</Badge>
                        {course.yearBuilt && <Badge variant="outline">{course.yearBuilt}</Badge>}
                      </div>
                      {course.assignedAdmin ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <UserCog className="w-4 h-4" />
                          <span>Managed by: {course.assignedAdmin.name || course.assignedAdmin.email}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <UserCog className="w-4 h-4" />
                          <span>No admin assigned</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openEditDialog(course)}
                          disabled={!canEditCourse(course, currentUser?.email, currentUser?.id)}
                        >
                          <Edit2 className="mr-1 h-3 w-3" />Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openHolesEditDialog(course)}
                          disabled={!canEditCourse(course, currentUser?.email, currentUser?.id)}
                        >
                          <ChevronRight className="mr-1 h-3 w-3" />Holes
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => deleteCourse(course)}
                          disabled={!canEditCourse(course, currentUser?.email, currentUser?.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Course Backup & Restore Card - Super Admin Only */}
            {isSuperAdmin(currentUser?.email) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Courses Backup & Restore
                  </CardTitle>
                  <CardDescription>
                    Export or import golf courses data (courses, holes, tees, distances)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    {/* Export Button */}
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={handleCourseBackup} 
                        disabled={courseBackupLoading}
                        variant="outline"
                      >
                        {courseBackupLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Export Courses
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Download all courses as JSON
                      </span>
                    </div>

                    {/* Import Section */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          id="courseRestoreFile"
                          type="file"
                          accept=".json"
                          onChange={handleCourseFileSelect}
                          disabled={courseRestoreLoading}
                          className="w-48"
                        />
                        <Button 
                          onClick={handleCourseRestore} 
                          disabled={!selectedCourseBackupFile || courseRestoreLoading}
                          variant="destructive"
                          size="sm"
                        >
                          {courseRestoreLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Import
                        </Button>
                      </div>
                      {selectedCourseBackupFile && (
                        <span className="text-xs text-muted-foreground">
                          Selected: {selectedCourseBackupFile.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Importing will replace all existing courses data. Export first to backup your current data.
                    </p>
                  </div>
                </CardContent>
              </Card>
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
                            {/* Tee Coordinates */}
                            <div className="flex items-center gap-2 pl-8">
                              <span className="text-xs text-amber-600 font-medium w-6">Tee</span>
                              <Input
                                placeholder="31.601578, -8.007917"
                                value={formatTeeGPS(hole)}
                                onChange={(e) => parseTeeGPSCoordinates(index, e.target.value)}
                                className="flex-1 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => captureTeeLocation(index)}
                                title="Use my current location for tee box"
                              >
                                <Crosshair className="w-4 h-4 text-amber-600" />
                              </Button>
                            </div>
                            {/* Green Coordinates */}
                            <div className="flex items-center gap-2 pl-8">
                              <span className="text-xs text-green-600 font-medium w-6">Green</span>
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
                                <Crosshair className="w-4 h-4 text-green-600" />
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
                              {/* Tee Coordinates */}
                              <div className="flex items-center gap-2 pl-8">
                                <span className="text-xs text-amber-600 font-medium w-6">Tee</span>
                                <Input
                                  placeholder="31.601578, -8.007917"
                                  value={formatTeeGPS(hole)}
                                  onChange={(e) => parseTeeGPSCoordinates(index + 9, e.target.value)}
                                  className="flex-1 text-xs"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => captureTeeLocation(index + 9)}
                                  title="Use my current location for tee box"
                                >
                                  <Crosshair className="w-4 h-4 text-amber-600" />
                                </Button>
                              </div>
                              {/* Green Coordinates */}
                              <div className="flex items-center gap-2 pl-8">
                                <span className="text-xs text-green-600 font-medium w-6">Green</span>
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
                                  <Crosshair className="w-4 h-4 text-green-600" />
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
                  <div className="divide-y max-h-96 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="p-3 text-sm">
                        {/* First line: Name, HCP, Rds */}
                        <div className="flex items-center gap-4">
                          <div className="font-medium truncate flex-1">{user.name || '-'}</div>
                          <div className="text-muted-foreground">HCP: {user.handicap || '-'}</div>
                          <div className="text-muted-foreground">Rds: {user._count.rounds}</div>
                        </div>
                        {/* Second line: Role, Status, Golfers */}
                        <div className="flex items-center gap-2 mt-2">
                          {isSuperAdmin(user.email) ? (
                            <Badge className="bg-purple-600 hover:bg-purple-700">
                              Super Admin
                            </Badge>
                          ) : (
                            <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                              {user.isAdmin ? 'Admin' : 'User'}
                            </Badge>
                          )}
                          <Badge variant={user.blocked ? 'destructive' : 'outline'}>
                            {user.blocked ? 'Blocked' : 'Active'}
                          </Badge>
                          <Badge variant={user.hiddenFromGolfers ? 'secondary' : 'outline'}>
                            {user.hiddenFromGolfers ? 'Hidden' : 'Visible'}
                          </Badge>
                        </div>
                        {/* Third line: Actions */}
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

          <TabsContent value="tournaments" className="space-y-6">
            {/* Tournament List or Participant Management */}
            {selectedTournament ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {selectedTournament.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedTournament.course.name} - {new Date(selectedTournament.date).toLocaleDateString()}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/tournaments/export?id=${selectedTournament.id}`, '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedTournament(null)}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Tournaments
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tournament Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(selectedTournament.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedTournament.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{selectedTournament.format}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedTournament.status)}
                    </div>
                  </div>

                  {/* Tabs for Leaderboard / Groups */}
                  <Tabs value={tournamentViewTab} onValueChange={(v) => setTournamentViewTab(v as 'leaderboard' | 'groups')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                      <TabsTrigger value="groups">Groups</TabsTrigger>
                    </TabsList>

                    {/* Leaderboard Tab */}
                    <TabsContent value="leaderboard" className="space-y-4">
                      {/* Participants */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">
                            Participants ({selectedTournament.participants?.length || 0}/{selectedTournament.maxPlayers})
                          </h3>
                          <Dialog open={addParticipantDialogOpen} onOpenChange={setAddParticipantDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" disabled={selectedTournament.status === 'completed' || selectedTournament.status === 'cancelled'}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Participant
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md w-[calc(100%-6px)] sm:w-full mx-auto">
                              <DialogHeader>
                                <DialogTitle>Add Participant</DialogTitle>
                                <DialogDescription>Select a user to add to this tournament</DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Select onValueChange={(userId) => {
                                  addParticipant(userId);
                                }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a user..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getAvailableUsers().map((user) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {user.name || user.email}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {getAvailableUsers().length === 0 && (
                                  <p className="text-sm text-muted-foreground mt-2">No available users to add</p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {selectedTournament.participants && selectedTournament.participants.length > 0 ? (
                          <div className="border rounded-lg overflow-hidden overflow-x-auto">
                            <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm items-center min-w-[500px]">
                              <div className="col-span-1">#</div>
                              <div className="col-span-4">Player</div>
                              <div 
                                className={`col-span-2 text-center cursor-pointer hover:bg-muted/80 rounded px-1 py-0.5 ${participantSort === 'handicap' ? 'bg-primary/10 text-primary' : ''}`}
                                onClick={() => setParticipantSort('handicap')}
                              >
                                Hcp {participantSort === 'handicap' && '↓'}
                              </div>
                              <div 
                                className={`col-span-2 text-center cursor-pointer hover:bg-muted/80 rounded px-1 py-0.5 ${participantSort === 'gross' ? 'bg-primary/10 text-primary' : ''}`}
                                onClick={() => setParticipantSort('gross')}
                              >
                                Brut {participantSort === 'gross' && '↓'}
                              </div>
                              <div 
                                className={`col-span-2 text-center cursor-pointer hover:bg-muted/80 rounded px-1 py-0.5 ${participantSort === 'net' ? 'bg-primary/10 text-primary' : ''}`}
                                onClick={() => setParticipantSort('net')}
                              >
                                Net {participantSort === 'net' && '↓'}
                              </div>
                              <div className="col-span-1"></div>
                            </div>
                            {getSortedParticipants().map((participant, index) => (
                              <div key={participant.userId} className="grid grid-cols-12 gap-2 p-3 items-center border-t min-w-[500px]">
                                <div className="col-span-1 text-muted-foreground">{index + 1}</div>
                                <div className="col-span-4 font-medium">{participant.user.name || 'Unnamed'}</div>
                                <div className="col-span-2 text-center">
                                  <Badge variant="outline" className="font-mono">
                                    {participant.user.handicap?.toFixed(1) || '-'}
                                  </Badge>
                                </div>
                                <div className="col-span-2">
                                  <Input
                                    type="number"
                                    className="w-full h-8 text-center"
                                    placeholder="-"
                                    value={participant.grossScore ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value ? parseInt(e.target.value) : null;
                                      const updated = selectedTournament.participants?.map(p =>
                                        p.userId === participant.userId ? { ...p, grossScore: val } : p
                                      );
                                      if (updated && selectedTournament) {
                                        setSelectedTournament({ ...selectedTournament, participants: updated });
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const val = e.target.value ? parseInt(e.target.value) : null;
                                      updateParticipantScore(participant.userId, val, participant.netScore);
                                    }}
                                    disabled={selectedTournament.status === 'completed'}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Input
                                    type="number"
                                    className="w-full h-8 text-center"
                                    placeholder="-"
                                    value={participant.netScore ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value ? parseInt(e.target.value) : null;
                                      const updated = selectedTournament.participants?.map(p =>
                                        p.userId === participant.userId ? { ...p, netScore: val } : p
                                      );
                                      if (updated && selectedTournament) {
                                        setSelectedTournament({ ...selectedTournament, participants: updated });
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const val = e.target.value ? parseInt(e.target.value) : null;
                                      updateParticipantScore(participant.userId, participant.grossScore, val);
                                    }}
                                    disabled={selectedTournament.status === 'completed'}
                                  />
                                </div>
                                <div className="col-span-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => removeParticipant(participant.userId)}
                                    disabled={selectedTournament.status === 'completed'}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">No participants yet</p>
                        )}
                      </div>
                    </TabsContent>

                    {/* Groups Tab */}
                    <TabsContent value="groups" className="space-y-4">
                      {/* Groups Controls */}
                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex flex-wrap gap-2 items-center">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Start:</Label>
                            <Input
                              type="time"
                              className="w-28 h-8"
                              value={teeTimeForm.startTime}
                              onChange={(e) => setTeeTimeForm({ ...teeTimeForm, startTime: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Interval:</Label>
                            <Select 
                              value={teeTimeForm.interval.toString()} 
                              onValueChange={(v) => setTeeTimeForm({ ...teeTimeForm, interval: parseInt(v) })}
                            >
                              <SelectTrigger className="w-20 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="8">8 min</SelectItem>
                                <SelectItem value="10">10 min</SelectItem>
                                <SelectItem value="12">12 min</SelectItem>
                                <SelectItem value="15">15 min</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={addNewGroup}
                            disabled={tournamentGroupsLoading}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Add Group
                          </Button>
                          <Button 
                            size="sm"
                            onClick={autoAssignGroups}
                            disabled={tournamentGroupsLoading || groupsData.unassigned.length === 0}
                          >
                            {tournamentGroupsLoading ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="mr-1 h-4 w-4" />
                            )}
                            Auto-Assign
                          </Button>
                        </div>
                      </div>

                      {tournamentGroupsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          {/* Groups Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {/* Render existing groups */}
                            {getGroupLetters().map((letter) => {
                              const groupParticipants = groupsData.groups[letter] || [];
                              const teeTime = groupParticipants[0]?.teeTime || '';
                              
                              return (
                                <div key={letter} className="border rounded-lg overflow-hidden">
                                  <div className="bg-primary/10 px-3 py-2 flex items-center justify-between">
                                    <span className="font-semibold">Group {letter}</span>
                                    {teeTime && <span className="text-sm text-muted-foreground">{teeTime}</span>}
                                  </div>
                                  <div className="p-2 space-y-1">
                                    {[1, 2, 3, 4].map((position) => {
                                      const participant = groupParticipants.find(p => p.positionInGroup === position);
                                      
                                      return (
                                        <div 
                                          key={position}
                                          className="flex items-center gap-2 p-2 rounded border bg-card"
                                        >
                                          <span className="text-sm text-muted-foreground w-4">{position}.</span>
                                          {participant ? (
                                            <>
                                              <span className="flex-1 text-sm truncate">{participant.user.name || 'Unnamed'}</span>
                                              <Badge variant="outline" className="text-xs">
                                                {participant.user.handicap?.toFixed(1) || '-'}
                                              </Badge>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                                                onClick={() => removePlayerFromGroup(participant.userId)}
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </>
                                          ) : (
                                            <>
                                              <span className="flex-1 text-sm text-muted-foreground italic">Empty</span>
                                              <Dialog>
                                                <DialogTrigger asChild>
                                                  <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => {
                                                      setSelectedGroupLetter(letter);
                                                      setSelectedPosition(position);
                                                    }}
                                                  >
                                                    <Plus className="h-3 w-3" />
                                                  </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-sm w-[calc(100%-6px)] sm:w-full mx-auto">
                                                  <DialogHeader>
                                                    <DialogTitle>Assign Player</DialogTitle>
                                                    <DialogDescription>
                                                      Select a player for Group {letter}, Position {position}
                                                    </DialogDescription>
                                                  </DialogHeader>
                                                  <div className="py-4 max-h-64 overflow-y-auto">
                                                    {groupsData.unassigned.length > 0 ? (
                                                      <div className="space-y-1">
                                                        {groupsData.unassigned.map((p) => (
                                                          <Button
                                                            key={p.userId}
                                                            variant="ghost"
                                                            className="w-full justify-start"
                                                            onClick={() => {
                                                              assignPlayerToGroup(p.userId, letter, position);
                                                            }}
                                                          >
                                                            <span className="flex-1 text-left">{p.user.name || 'Unnamed'}</span>
                                                            <Badge variant="outline" className="ml-2">
                                                              {p.user.handicap?.toFixed(1) || '-'}
                                                            </Badge>
                                                          </Button>
                                                        ))}
                                                      </div>
                                                    ) : (
                                                      <p className="text-sm text-muted-foreground text-center py-4">
                                                        No unassigned players
                                                      </p>
                                                    )}
                                                  </div>
                                                </DialogContent>
                                              </Dialog>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Add new group card */}
                            <div 
                              className="border-2 border-dashed rounded-lg flex items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/50 transition-colors"
                              onClick={addNewGroup}
                            >
                              <div className="text-center text-muted-foreground">
                                <Plus className="w-8 h-8 mx-auto mb-2" />
                                <span className="text-sm">Add Group</span>
                              </div>
                            </div>
                          </div>

                          {/* Unassigned Players */}
                          {groupsData.unassigned.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                              <div className="bg-amber-100 dark:bg-amber-900/20 px-4 py-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span className="font-medium">Unassigned Players ({groupsData.unassigned.length})</span>
                              </div>
                              <div className="p-3 flex flex-wrap gap-2">
                                {groupsData.unassigned.map((p) => (
                                  <Badge 
                                    key={p.userId} 
                                    variant="outline" 
                                    className="py-1 px-2 text-sm"
                                  >
                                    {p.user.name || 'Unnamed'} ({p.user.handicap?.toFixed(1) || '-'})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search tournaments..."
                      value={tournamentSearchQuery}
                      onChange={(e) => setTournamentSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog open={addTournamentDialogOpen} onOpenChange={setAddTournamentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="mr-2 h-4 w-4" />Add Tournament</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add New Tournament</DialogTitle>
                        <DialogDescription>Create a new golf tournament</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="tournamentName">Tournament Name *</Label>
                          <Input
                            id="tournamentName"
                            value={newTournamentForm.name}
                            onChange={(e) => setNewTournamentForm({ ...newTournamentForm, name: e.target.value })}
                            placeholder="e.g., Annual Club Championship"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="course">Golf Course *</Label>
                          <Select
                            value={newTournamentForm.courseId}
                            onValueChange={(value) => setNewTournamentForm({ ...newTournamentForm, courseId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course..." />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name} - {course.city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                              id="date"
                              type="date"
                              value={newTournamentForm.date}
                              onChange={(e) => setNewTournamentForm({ ...newTournamentForm, date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input
                              id="startTime"
                              type="time"
                              value={newTournamentForm.startTime}
                              onChange={(e) => setNewTournamentForm({ ...newTournamentForm, startTime: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="format">Format</Label>
                            <Select
                              value={newTournamentForm.format}
                              onValueChange={(value) => setNewTournamentForm({ ...newTournamentForm, format: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Stroke Play">Stroke Play</SelectItem>
                                <SelectItem value="Match Play">Match Play</SelectItem>
                                <SelectItem value="Stableford">Stableford</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maxPlayers">Max Players</Label>
                            <Input
                              id="maxPlayers"
                              type="number"
                              min={1}
                              value={newTournamentForm.maxPlayers}
                              onChange={(e) => setNewTournamentForm({ ...newTournamentForm, maxPlayers: parseInt(e.target.value) || 144 })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={newTournamentForm.notes}
                            onChange={(e) => setNewTournamentForm({ ...newTournamentForm, notes: e.target.value })}
                            placeholder="Additional tournament details..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddTournamentDialogOpen(false)}>Cancel</Button>
                        <Button
                          onClick={createTournament}
                          disabled={saving || !newTournamentForm.name || !newTournamentForm.courseId || !newTournamentForm.date}
                        >
                          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Tournament
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
                    {filteredTournaments.map((tournament) => (
                      <Card
                        key={tournament.id}
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => selectTournamentWithParticipants(tournament)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{tournament.name}</CardTitle>
                              <CardDescription>{tournament.course.name}</CardDescription>
                            </div>
                            {getStatusBadge(tournament.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(tournament.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{tournament.startTime}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">{tournament.format}</Badge>
                            <Badge variant="outline">{tournament._count?.participants || 0}/{tournament.maxPlayers} players</Badge>
                          </div>
                          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openTournamentEditDialog(tournament)}
                            >
                              <Edit2 className="mr-1 h-3 w-3" />Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteTournament(tournament)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredTournaments.length === 0 && (
                      <div className="col-span-full p-8 text-center text-muted-foreground">
                        No tournaments found. Click "Add Tournament" to create one.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            {selectedGroup ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserCircle className="w-5 h-5" />
                        {selectedGroup.name}
                      </CardTitle>
                      <CardDescription>
                        {selectedGroup.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Groups
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      Members ({selectedGroup.members?.length || 0})
                    </h3>
                    <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Member to Group</DialogTitle>
                          <DialogDescription>Select a golfer to add to this group</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Select onValueChange={(userId) => {
                            addMemberToGroup(userId);
                            setAddMemberDialogOpen(false);
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a golfer..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getUsersNotInGroup().map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name || user.email} (HCP: {user.handicap || '-'})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {getUsersNotInGroup().length === 0 && (
                            <p className="text-sm text-muted-foreground mt-2">All golfers are already in this group</p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {selectedGroup.members && selectedGroup.members.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Name</div>
                        <div className="col-span-2">HCP</div>
                        <div className="col-span-3">City</div>
                        <div className="col-span-1"></div>
                      </div>
                      {selectedGroup.members.map((member, index) => (
                        <div key={member.userId} className="grid grid-cols-12 gap-2 p-3 items-center border-t">
                          <div className="col-span-1 text-muted-foreground">{index + 1}</div>
                          <div className="col-span-5 font-medium">{member.user.name || 'Unknown'}</div>
                          <div className="col-span-2 text-center">
                            <Badge variant="outline">{member.user.handicap?.toFixed(1) || '-'}</Badge>
                          </div>
                          <div className="col-span-3 text-muted-foreground text-sm">{member.user.city || '-'}</div>
                          <div className="col-span-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => removeMemberFromGroup(member.userId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No members in this group</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold">Manage Groups</h2>
                  <Dialog open={addGroupDialogOpen} onOpenChange={setAddGroupDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="mr-2 h-4 w-4" />Add Group</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Group</DialogTitle>
                        <DialogDescription>Create a group to organize golfers</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="groupName">Group Name *</Label>
                          <Input
                            id="groupName"
                            value={newGroupForm.name}
                            onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                            placeholder="e.g., Sunday Golfers"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="groupDescription">Description</Label>
                          <Textarea
                            id="groupDescription"
                            value={newGroupForm.description}
                            onChange={(e) => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
                            placeholder="Optional description..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddGroupDialogOpen(false)}>Cancel</Button>
                        <Button
                          onClick={createGroup}
                          disabled={saving || !newGroupForm.name.trim()}
                        >
                          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Group
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {groupsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                      <Card
                        key={group.id}
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => fetchGroupWithMembers(group.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{group.name}</CardTitle>
                              <CardDescription className="line-clamp-2 mt-1">
                                {group.description || 'No description'}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary">
                              {group._count?.members || 0} members
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditGroupForm({
                                  id: group.id,
                                  name: group.name,
                                  description: group.description || ''
                                });
                                setEditGroupDialogOpen(true);
                              }}
                            >
                              <Edit2 className="mr-1 h-3 w-3" />Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteGroup(group.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {groups.length === 0 && (
                      <div className="col-span-full p-8 text-center text-muted-foreground">
                        No groups created yet. Click "Add Group" to create one.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Edit Group Dialog */}
            <Dialog open={editGroupDialogOpen} onOpenChange={setEditGroupDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Group</DialogTitle>
                  <DialogDescription>Update group details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editGroupName">Group Name *</Label>
                    <Input
                      id="editGroupName"
                      value={editGroupForm.name}
                      onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editGroupDescription">Description</Label>
                    <Textarea
                      id="editGroupDescription"
                      value={editGroupForm.description}
                      onChange={(e) => setEditGroupForm({ ...editGroupForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditGroupDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={updateGroup}
                    disabled={saving || !editGroupForm.name.trim()}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  <CardDescription>Send a message to golfers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="messageTarget">Send To</Label>
                    <Select 
                      value={messageTargetType} 
                      onValueChange={(value) => {
                        setMessageTargetType(value as 'all' | 'group' | 'user');
                        setMessageTargetId('');
                      }}
                    >
                      <SelectTrigger id="messageTarget">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Golfers</SelectItem>
                        <SelectItem value="group">Specific Group</SelectItem>
                        <SelectItem value="user">Specific Golfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {messageTargetType === 'group' && (
                    <div className="space-y-2">
                      <Label htmlFor="targetGroup">Select Group</Label>
                      <Select 
                        value={messageTargetId} 
                        onValueChange={(value) => setMessageTargetId(value)}
                      >
                        <SelectTrigger id="targetGroup">
                          <SelectValue placeholder="Choose a group..." />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name} ({group._count?.members || 0} members)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {groups.length === 0 && (
                        <p className="text-sm text-muted-foreground">No groups available. Create groups first.</p>
                      )}
                    </div>
                  )}

                  {messageTargetType === 'user' && (
                    <div className="space-y-2">
                      <Label htmlFor="targetUser">Select Golfer</Label>
                      <Select 
                        value={messageTargetId} 
                        onValueChange={(value) => setMessageTargetId(value)}
                      >
                        <SelectTrigger id="targetUser">
                          <SelectValue placeholder="Choose a golfer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => !u.hiddenFromGolfers).map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email} (HCP: {user.handicap || '-'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                    disabled={messagesLoading || !newMessageTitle.trim() || !newMessageContent.trim() || (messageTargetType !== 'all' && !messageTargetId)}
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
                              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  From: {msg.author.name || msg.author.email}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                  To: {getRecipientDisplay(msg.targetType, msg.targetId, msg.targetName)}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                                  {msg.readCount} read
                                </span>
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

            {/* Super Admin Only - Database Tools */}
            {isSuperAdmin(currentUser?.email) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Tools
                  </CardTitle>
                  <CardDescription>Super Admin only - Database maintenance tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Add Default Tee Types to Courses</Label>
                      <p className="text-sm text-muted-foreground">
                        Add Championship, Mens, and Womens tee types to all courses that don't have tees configured
                      </p>
                      <Button 
                        onClick={async () => {
                          if (!confirm('Add default tee types (Championship, Mens, Womens) to all courses without tees?')) return;
                          try {
                            setSettingsLoading(true);
                            const response = await fetch('/api/admin/add-default-tees', { method: 'POST' });
                            const data = await response.json();
                            if (response.ok) {
                              toast({ 
                                title: 'Success', 
                                description: `Updated ${data.updated} courses, skipped ${data.skipped} courses that already have tees` 
                              });
                              fetchCourses();
                            } else {
                              throw new Error(data.error || 'Failed to add default tees');
                            }
                          } catch (error) {
                            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
                          } finally {
                            setSettingsLoading(false);
                          }
                        }} 
                        disabled={settingsLoading}
                        variant="outline"
                        className="w-fit"
                      >
                        {settingsLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Add Default Tees to Courses
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Backup & Restore Tab */}
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Backup & Restore
                </CardTitle>
                <CardDescription>
                  Export your entire database as a JSON file or restore from a previous backup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Export Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Export Database</h3>
                  <p className="text-sm text-muted-foreground">
                    Download a complete backup of all your data including users, courses, rounds, scores, and settings.
                    The backup file will be in JSON format and can be used to restore your database later.
                  </p>
                  <Button 
                    onClick={handleBackup} 
                    disabled={backupLoading}
                    className="w-fit"
                  >
                    {backupLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download Backup
                  </Button>
                </div>

                <Separator />

                {/* Import Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Restore Database</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Warning: This will replace all existing data!</p>
                      <p className="mt-1">
                        Restoring from a backup will delete all current data and replace it with the backup contents.
                        Make sure to download a backup of your current data first.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="restoreFile">Select Backup File</Label>
                    <Input
                      id="restoreFile"
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      disabled={restoreLoading}
                    />
                    {selectedBackupFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedBackupFile.name}
                      </p>
                    )}
                    <Button 
                      onClick={handleRestore} 
                      disabled={!selectedBackupFile || restoreLoading}
                      variant="destructive"
                      className="w-fit"
                    >
                      {restoreLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Restore Database
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Backup Info */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">What's Included in Backup</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Users & Profiles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Golf Courses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Course Holes & Tees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Rounds & Scores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Tournaments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Golfer Groups</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Messages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Favorites</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Settings</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab - Super Admin Only */}
          {adminPermissions?.isSuperAdmin && (
            <TabsContent value="permissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Admin Permissions
                      </CardTitle>
                      <CardDescription>Manage which tabs each admin can access</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAdminUsers}
                      disabled={permissionsLoading}
                    >
                      {permissionsLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {permissionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : adminUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No admin users found.</p>
                      <p className="text-sm mt-2">Regular admins will appear here once created.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {adminUsers.map((adminUser) => (
                        <Card key={adminUser.id} className="overflow-hidden">
                          <CardHeader className="py-3 px-4 bg-muted/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{adminUser.name || 'No name'}</p>
                                <p className="text-sm text-muted-foreground">{adminUser.email}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3 px-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`${adminUser.id}-courses`}
                                  checked={adminUser.adminPermission?.canViewCourses ?? true}
                                  onChange={(e) => updateAdminPermission(adminUser.id, {
                                    canViewCourses: e.target.checked,
                                    canViewUsers: adminUser.adminPermission?.canViewUsers ?? true,
                                    canViewTournaments: adminUser.adminPermission?.canViewTournaments ?? true,
                                    canViewGroups: adminUser.adminPermission?.canViewGroups ?? true,
                                    canViewMessages: adminUser.adminPermission?.canViewMessages ?? true,
                                    canViewSettings: adminUser.adminPermission?.canViewSettings ?? true,
                                    canViewBackup: adminUser.adminPermission?.canViewBackup ?? false,
                                  })}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor={`${adminUser.id}-courses`} className="text-sm">Courses</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`${adminUser.id}-users`}
                                  checked={adminUser.adminPermission?.canViewUsers ?? true}
                                  onChange={(e) => updateAdminPermission(adminUser.id, {
                                    canViewCourses: adminUser.adminPermission?.canViewCourses ?? true,
                                    canViewUsers: e.target.checked,
                                    canViewTournaments: adminUser.adminPermission?.canViewTournaments ?? true,
                                    canViewGroups: adminUser.adminPermission?.canViewGroups ?? true,
                                    canViewMessages: adminUser.adminPermission?.canViewMessages ?? true,
                                    canViewSettings: adminUser.adminPermission?.canViewSettings ?? true,
                                    canViewBackup: adminUser.adminPermission?.canViewBackup ?? false,
                                  })}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor={`${adminUser.id}-users`} className="text-sm">Users</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`${adminUser.id}-tournaments`}
                                  checked={adminUser.adminPermission?.canViewTournaments ?? true}
                                  onChange={(e) => updateAdminPermission(adminUser.id, {
                                    canViewCourses: adminUser.adminPermission?.canViewCourses ?? true,
                                    canViewUsers: adminUser.adminPermission?.canViewUsers ?? true,
                                    canViewTournaments: e.target.checked,
                                    canViewGroups: adminUser.adminPermission?.canViewGroups ?? true,
                                    canViewMessages: adminUser.adminPermission?.canViewMessages ?? true,
                                    canViewSettings: adminUser.adminPermission?.canViewSettings ?? true,
                                    canViewBackup: adminUser.adminPermission?.canViewBackup ?? false,
                                  })}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor={`${adminUser.id}-tournaments`} className="text-sm">Tournaments</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`${adminUser.id}-groups`}
                                  checked={adminUser.adminPermission?.canViewGroups ?? true}
                                  onChange={(e) => updateAdminPermission(adminUser.id, {
                                    canViewCourses: adminUser.adminPermission?.canViewCourses ?? true,
                                    canViewUsers: adminUser.adminPermission?.canViewUsers ?? true,
                                    canViewTournaments: adminUser.adminPermission?.canViewTournaments ?? true,
                                    canViewGroups: e.target.checked,
                                    canViewMessages: adminUser.adminPermission?.canViewMessages ?? true,
                                    canViewSettings: adminUser.adminPermission?.canViewSettings ?? true,
                                    canViewBackup: adminUser.adminPermission?.canViewBackup ?? false,
                                  })}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor={`${adminUser.id}-groups`} className="text-sm">Groups</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`${adminUser.id}-messages`}
                                  checked={adminUser.adminPermission?.canViewMessages ?? true}
                                  onChange={(e) => updateAdminPermission(adminUser.id, {
                                    canViewCourses: adminUser.adminPermission?.canViewCourses ?? true,
                                    canViewUsers: adminUser.adminPermission?.canViewUsers ?? true,
                                    canViewTournaments: adminUser.adminPermission?.canViewTournaments ?? true,
                                    canViewGroups: adminUser.adminPermission?.canViewGroups ?? true,
                                    canViewMessages: e.target.checked,
                                    canViewSettings: adminUser.adminPermission?.canViewSettings ?? true,
                                    canViewBackup: adminUser.adminPermission?.canViewBackup ?? false,
                                  })}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor={`${adminUser.id}-messages`} className="text-sm">Messages</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`${adminUser.id}-settings`}
                                  checked={adminUser.adminPermission?.canViewSettings ?? true}
                                  onChange={(e) => updateAdminPermission(adminUser.id, {
                                    canViewCourses: adminUser.adminPermission?.canViewCourses ?? true,
                                    canViewUsers: adminUser.adminPermission?.canViewUsers ?? true,
                                    canViewTournaments: adminUser.adminPermission?.canViewTournaments ?? true,
                                    canViewGroups: adminUser.adminPermission?.canViewGroups ?? true,
                                    canViewMessages: adminUser.adminPermission?.canViewMessages ?? true,
                                    canViewSettings: e.target.checked,
                                    canViewBackup: adminUser.adminPermission?.canViewBackup ?? false,
                                  })}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor={`${adminUser.id}-settings`} className="text-sm">Settings</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`${adminUser.id}-backup`}
                                  checked={adminUser.adminPermission?.canViewBackup ?? false}
                                  onChange={(e) => updateAdminPermission(adminUser.id, {
                                    canViewCourses: adminUser.adminPermission?.canViewCourses ?? true,
                                    canViewUsers: adminUser.adminPermission?.canViewUsers ?? true,
                                    canViewTournaments: adminUser.adminPermission?.canViewTournaments ?? true,
                                    canViewGroups: adminUser.adminPermission?.canViewGroups ?? true,
                                    canViewMessages: adminUser.adminPermission?.canViewMessages ?? true,
                                    canViewSettings: adminUser.adminPermission?.canViewSettings ?? true,
                                    canViewBackup: e.target.checked,
                                  })}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor={`${adminUser.id}-backup`} className="text-sm">Backup</Label>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
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
            <div className="space-y-2">
              <Label>Assigned Admin</Label>
              <Select 
                value={editForm.adminId || 'none'} 
                onValueChange={(value) => setEditForm({ ...editForm, adminId: value === 'none' ? null : value })}
                disabled={!isSuperAdmin(currentUser?.email)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an admin to manage this course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No admin assigned (Super admins can edit)</SelectItem>
                  {users.filter(u => u.isAdmin).map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name || admin.email} {isSuperAdmin(admin.email) ? '(Super Admin)' : '(Admin)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {!isSuperAdmin(currentUser?.email) 
                  ? 'Only super admins can reassign courses'
                  : 'Only the assigned admin and super admins can edit this course'}
              </p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border" style={{borderColor: '#8ab0d1', backgroundColor: editForm.isActive ? '#dcfce7' : '#fee2e2'}}>
              <div>
                <Label className="text-base font-semibold">Course Status</Label>
                <p className="text-sm text-muted-foreground">
                  {editForm.isActive ? 'Active - Users can play this course' : 'Inactive - Shows "Coming Soon" in app'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${editForm.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {editForm.isActive ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  checked={editForm.isActive}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                />
              </div>
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
              <div className="space-y-0.5">
                <Label htmlFor="isAdmin">Admin Role</Label>
                {isSuperAdmin(editUserForm.email) && (
                  <p className="text-xs text-muted-foreground">Super Admin status cannot be changed</p>
                )}
              </div>
              <Switch 
                id="isAdmin" 
                checked={editUserForm.isAdmin} 
                onCheckedChange={(checked) => setEditUserForm({ ...editUserForm, isAdmin: checked })}
                disabled={isSuperAdmin(editUserForm.email)}
              />
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

      {/* Edit Tournament Dialog */}
      <Dialog open={editTournamentDialogOpen} onOpenChange={setEditTournamentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Tournament</DialogTitle>
            <DialogDescription>Update tournament information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tournament Name *</Label>
              <Input
                value={editTournamentForm.name}
                onChange={(e) => setEditTournamentForm({ ...editTournamentForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Golf Course *</Label>
              <Select
                value={editTournamentForm.courseId}
                onValueChange={(value) => setEditTournamentForm({ ...editTournamentForm, courseId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} - {course.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={editTournamentForm.date}
                  onChange={(e) => setEditTournamentForm({ ...editTournamentForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={editTournamentForm.startTime}
                  onChange={(e) => setEditTournamentForm({ ...editTournamentForm, startTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={editTournamentForm.format}
                  onValueChange={(value) => setEditTournamentForm({ ...editTournamentForm, format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stroke Play">Stroke Play</SelectItem>
                    <SelectItem value="Match Play">Match Play</SelectItem>
                    <SelectItem value="Stableford">Stableford</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Players</Label>
                <Input
                  type="number"
                  min={1}
                  value={editTournamentForm.maxPlayers}
                  onChange={(e) => setEditTournamentForm({ ...editTournamentForm, maxPlayers: parseInt(e.target.value) || 144 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editTournamentForm.status}
                onValueChange={(value) => setEditTournamentForm({ ...editTournamentForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editTournamentForm.notes}
                onChange={(e) => setEditTournamentForm({ ...editTournamentForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTournamentDialogOpen(false)}>Cancel</Button>
            <Button onClick={updateTournament} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
