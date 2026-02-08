import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  Plus, Upload, Link2, MoreVertical, Edit, Trash2,
  Facebook, Twitter, Instagram, Linkedin, Youtube, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const platformIcons = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Globe,
  other: Globe
};

const platformColors = {
  facebook: "bg-blue-600",
  twitter: "bg-sky-500",
  instagram: "bg-pink-500",
  linkedin: "bg-blue-700",
  youtube: "bg-red-600",
  tiktok: "bg-slate-900",
  other: "bg-slate-500"
};

export default function SocialMediaPage() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    platform: "instagram",
    post_link: "",
    media_type: "image",
    posted_by: "",
    posted_date: new Date().toISOString().split('T')[0],
    channel: "",
    file_urls: []
  });
  
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ['socialposts'],
    queryFn: () => base44.entities.SocialPost.list('-posted_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialposts'] });
      setShowForm(false);
      resetForm();
      toast.success("Post logged");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SocialPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialposts'] });
      setShowForm(false);
      setEditingPost(null);
      resetForm();
      toast.success("Post updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialposts'] });
      toast.success("Post deleted");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      platform: "instagram",
      post_link: "",
      media_type: "image",
      posted_by: user?.email || "",
      posted_date: new Date().toISOString().split('T')[0],
      channel: "",
      file_urls: []
    });
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || "",
      content: post.content || "",
      platform: post.platform || "instagram",
      post_link: post.post_link || "",
      media_type: post.media_type || "image",
      posted_by: post.posted_by || "",
      posted_date: post.posted_date || new Date().toISOString().split('T')[0],
      channel: post.channel || "",
      file_urls: post.file_urls || []
    });
    setShowForm(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, file_urls: [...formData.file_urls, file_url] });
      toast.success("File uploaded");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, posted_by: formData.posted_by || user?.email });
    }
  };

  const filteredPosts = filter === "all" ? posts : posts.filter(p => p.platform === filter);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Social Media</h1>
            <p className="text-slate-500 mt-1">Track posts and content across platforms</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Log Post
          </Button>
        </motion.div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="facebook">Facebook</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="twitter">Twitter</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => {
            const Icon = platformIcons[post.platform] || Globe;
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {post.file_urls?.[0] && (
                  <div className="aspect-video bg-slate-100">
                    <img src={post.file_urls[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${platformColors[post.platform]}`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium capitalize">{post.platform}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(post)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        {post.post_link && (
                          <DropdownMenuItem onClick={() => window.open(post.post_link, '_blank')}>
                            <Link2 className="w-4 h-4 mr-2" /> View Post
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => deleteMutation.mutate(post.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="font-semibold text-slate-900 mb-1">{post.title}</h3>
                  {post.content && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">{post.content}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{post.posted_by?.split('@')[0] || 'Unknown'}</span>
                    <span>{post.posted_date && format(new Date(post.posted_date), 'MMM d, yyyy')}</span>
                  </div>
                  
                  {post.channel && (
                    <Badge variant="secondary" className="mt-2 text-xs">{post.channel}</Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-medium text-slate-900">No posts yet</h3>
            <p className="text-sm text-slate-500 mt-1">Log your social media posts</p>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) { setEditingPost(null); resetForm(); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "Log Social Media Post"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Post title"
                required
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Post caption/content"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Platform</Label>
                <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Media Type</Label>
                <Select value={formData.media_type} onValueChange={(v) => setFormData({ ...formData, media_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Post Link</Label>
                <Input
                  value={formData.post_link}
                  onChange={(e) => setFormData({ ...formData, post_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Channel</Label>
                <Input
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  placeholder="Channel name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Posted By</Label>
                <Input
                  value={formData.posted_by}
                  onChange={(e) => setFormData({ ...formData, posted_by: e.target.value })}
                  placeholder="Email"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {formData.posted_date ? format(new Date(formData.posted_date), 'MMM d, yyyy') : 'Pick'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.posted_date ? new Date(formData.posted_date) : undefined}
                      onSelect={(d) => setFormData({ ...formData, posted_date: d?.toISOString().split('T')[0] || '' })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label>Upload Media</Label>
              <Input type="file" onChange={handleFileUpload} disabled={uploading} accept="image/*,video/*" />
              {formData.file_urls.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {formData.file_urls.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded" />
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={uploading}>{editingPost ? "Update" : "Log Post"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}