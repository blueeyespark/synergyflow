import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Play, Calendar, Settings, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function YouTubePublisher() {
  const [step, setStep] = useState("upload");
  const [video, setVideo] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [scheduleDate, setScheduleDate] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo({ name: file.name, size: (file.size / 1024 / 1024).toFixed(2), file });
      setStep("metadata");
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    setIsPublishing(true);
    try {
      // Simulate publishing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(scheduleDate ? `Video scheduled for ${scheduleDate}` : "Video publishing to YouTube...");
      setStep("success");
    } catch (error) {
      toast.error("Failed to publish video");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReset = () => {
    setVideo(null);
    setTitle("");
    setDescription("");
    setTags("");
    setVisibility("private");
    setScheduleDate("");
    setStep("upload");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {step === "upload" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-2 border-dashed border-red-300 p-12 text-center">
          <label className="cursor-pointer">
            <Upload className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Upload Video</h3>
            <p className="text-slate-600 mb-6">Drag and drop or click to select (Max 256GB)</p>
            <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
              Select Video File
            </Button>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </label>
        </motion.div>
      )}

      {step === "metadata" && video && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-100 rounded-xl p-4">
            <p className="text-sm font-medium text-slate-700">📹 {video.name}</p>
            <p className="text-xs text-slate-500">{video.size} MB</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-2">Video Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                className="text-lg"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-2">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers what your video is about"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-2">Tags</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Separate tags with commas"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-900 block mb-2">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900 block mb-2">Schedule (Optional)</label>
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Publish to YouTube
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {step === "success" && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-50 rounded-2xl border border-green-200 p-8 text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Video Published Successfully!</h3>
          <p className="text-slate-600 mb-6">Your video is now live on YouTube or scheduled for later</p>
          <Button onClick={handleReset} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
            Publish Another Video
          </Button>
        </motion.div>
      )}
    </div>
  );
}