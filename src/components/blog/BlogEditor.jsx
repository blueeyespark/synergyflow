import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Wand2, Tags, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import AIBlogAssistant from "./AIBlogAssistant";

export default function BlogEditor({ open, onOpenChange, post }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    status: "draft",
    tags: [],
    meta_title: "",
    meta_description: "",
    tone: "professional",
    featured_image: ""
  });
  const [newTag, setNewTag] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || "",
        content: post.content || "",
        excerpt: post.excerpt || "",
        status: post.status || "draft",
        tags: post.tags || [],
        meta_title: post.meta_title || "",
        meta_description: post.meta_description || "",
        tone: post.tone || "professional",
        featured_image: post.featured_image || ""
      });
    } else {
      setFormData({
        title: "",
        content: "",
        excerpt: "",
        status: "draft",
        tags: [],
        meta_title: "",
        meta_description: "",
        tone: "professional",
        featured_image: ""
      });
    }
  }, [post, open]);

  const saveMutation = useMutation({
    mutationFn: (data) => post 
      ? base44.entities.BlogPost.update(post.id, data)
      : base44.entities.BlogPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogposts'] });
      onOpenChange(false);
      toast.success(post ? "Post updated" : "Post created");
    },
  });

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  // AI Features
  const generatePost = async (topic) => {
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a comprehensive blog post about: ${topic}. 
        Tone: ${formData.tone}
        Format the content in markdown with proper headings, paragraphs, and bullet points where appropriate.
        Make it engaging and informative, around 500-800 words.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            excerpt: { type: "string" }
          }
        }
      });
      setFormData({ ...formData, ...result });
      toast.success("Blog post generated!");
    } catch (error) {
      toast.error("Failed to generate post");
    } finally {
      setAiLoading(false);
    }
  };

  const changeTone = async (newTone) => {
    if (!formData.content) {
      toast.error("Write some content first");
      return;
    }
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Rewrite the following blog post content to have a ${newTone} tone. Keep the same information but adjust the style and language:

${formData.content}`,
        response_json_schema: {
          type: "object",
          properties: {
            content: { type: "string" }
          }
        }
      });
      setFormData({ ...formData, content: result.content, tone: newTone });
      toast.success(`Tone changed to ${newTone}`);
    } catch (error) {
      toast.error("Failed to change tone");
    } finally {
      setAiLoading(false);
    }
  };

  const generateTagsAndMeta = async () => {
    if (!formData.content && !formData.title) {
      toast.error("Add title or content first");
      return;
    }
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this blog post, generate SEO-optimized tags and metadata:

Title: ${formData.title}
Content: ${formData.content?.substring(0, 1000)}

Generate:
1. 5-7 relevant tags for categorization
2. An SEO meta title (under 60 characters)
3. An SEO meta description (under 160 characters)`,
        response_json_schema: {
          type: "object",
          properties: {
            tags: { type: "array", items: { type: "string" } },
            meta_title: { type: "string" },
            meta_description: { type: "string" }
          }
        }
      });
      setFormData({ 
        ...formData, 
        tags: result.tags || formData.tags,
        meta_title: result.meta_title || formData.meta_title,
        meta_description: result.meta_description || formData.meta_description
      });
      toast.success("Tags and metadata generated!");
    } catch (error) {
      toast.error("Failed to generate metadata");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{post ? "Edit Post" : "Create New Post"}</DialogTitle>
            <div className="flex gap-2">
              <Sheet open={showAI} onOpenChange={setShowAI}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI Assistant
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      AI Blog Assistant
                    </SheetTitle>
                  </SheetHeader>
                  <AIBlogAssistant
                    onGeneratePost={generatePost}
                    onChangeTone={changeTone}
                    onGenerateMeta={generateTagsAndMeta}
                    currentTone={formData.tone}
                    loading={aiLoading}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Your blog post title"
              className="text-lg font-medium"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Content</Label>
              {aiLoading && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
            </div>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your blog post content here... (Markdown supported)"
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          {/* Excerpt */}
          <div>
            <Label>Excerpt</Label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Short summary for previews"
              rows={2}
            />
          </div>

          {/* Status and Tone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tone</Label>
              <Select value={formData.tone} onValueChange={(v) => changeTone(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Tags</Label>
              <Button variant="ghost" size="sm" onClick={generateTagsAndMeta} disabled={aiLoading}>
                <Tags className="w-4 h-4 mr-1" />
                Auto-generate
              </Button>
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag"
              />
              <Button type="button" onClick={addTag} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-4">
            <h4 className="font-medium text-sm text-slate-700 flex items-center gap-2">
              SEO Metadata
              <Button variant="ghost" size="sm" onClick={generateTagsAndMeta} disabled={aiLoading}>
                <Wand2 className="w-4 h-4" />
              </Button>
            </h4>
            <div>
              <Label>Meta Title</Label>
              <Input
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="SEO title (max 60 chars)"
                maxLength={60}
              />
              <p className="text-xs text-slate-400 mt-1">{formData.meta_title.length}/60</p>
            </div>
            <div>
              <Label>Meta Description</Label>
              <Textarea
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="SEO description (max 160 chars)"
                maxLength={160}
                rows={2}
              />
              <p className="text-xs text-slate-400 mt-1">{formData.meta_description.length}/160</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              onClick={() => saveMutation.mutate(formData)} 
              disabled={saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}