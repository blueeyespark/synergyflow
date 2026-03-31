import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Filter, Upload, Trash2, Star, Tag, Folder, FileVideo, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const assetTypeIcons = {
  raw_footage: FileVideo,
  thumbnail: ImageIcon,
  export: FileVideo,
  audio: FileVideo,
  template: Folder,
  graphic: ImageIcon,
};

const assetTypeColors = {
  raw_footage: "bg-blue-100 text-blue-700",
  thumbnail: "bg-purple-100 text-purple-700",
  export: "bg-green-100 text-green-700",
  audio: "bg-orange-100 text-orange-700",
  template: "bg-pink-100 text-pink-700",
  graphic: "bg-yellow-100 text-yellow-700",
};

export default function MediaLibrary() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState("raw_footage");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: assets = [] } = useQuery({
    queryKey: ["media_assets", user?.email],
    queryFn: () => base44.entities.MediaAsset.list("-created_date"),
    enabled: !!user?.email,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      const { file, ...assetData } = data;
      const uploaded = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.MediaAsset.create({
        ...assetData,
        file_url: uploaded.file_url,
        file_size_mb: (file.size / (1024 * 1024)).toFixed(2),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media_assets"] });
      toast.success("Asset uploaded successfully");
      setShowUpload(false);
      setUploadName("");
      setUploadFile(null);
      setUploadTags("");
      setUploadCategory("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MediaAsset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media_assets"] });
      toast.success("Asset deleted");
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (id) => {
      const asset = assets.find(a => a.id === id);
      return base44.entities.MediaAsset.update(id, { is_favorite: !asset.is_favorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media_assets"] });
    },
  });

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "all" || a.asset_type === selectedType;
    const matchesCategory = selectedCategory === "all" || a.category === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = [...new Set(assets.map(a => a.category).filter(Boolean))];
  const assetTypes = ["raw_footage", "thumbnail", "export", "audio", "template", "graphic"];

  const handleUpload = () => {
    if (!uploadName || !uploadFile) {
      toast.error("Please fill in all required fields");
      return;
    }
    uploadMutation.mutate({
      name: uploadName,
      file: uploadFile,
      asset_type: uploadType,
      tags: uploadTags.split(",").map(t => t.trim()).filter(Boolean),
      category: uploadCategory,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Media Library</h1>
              <p className="text-slate-500 mt-1">Organize and manage your video assets</p>
            </div>
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 gap-2">
                  <Upload className="w-4 h-4" /> Upload Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Media Asset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Asset Name *</label>
                    <Input
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="My footage clip"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Type *</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      {assetTypes.map(t => (
                        <option key={t} value={t}>{t.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Category</label>
                    <Input
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      placeholder="e.g., Editing, Transitions"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Tags</label>
                    <Input
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">File *</label>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0])}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="w-full">
                    {uploadMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assets..."
                className="pl-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              {assetTypes.map(t => (
                <option key={t} value={t}>{t.replace("_", " ")}</option>
              ))}
            </select>
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </motion.div>

        {/* Assets Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset, i) => {
            const IconComponent = assetTypeIcons[asset.asset_type] || FileVideo;
            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                <div className="bg-gradient-to-br from-slate-100 to-slate-50 p-4 flex items-center justify-center aspect-video">
                  <IconComponent className="w-10 h-10 text-slate-400" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{asset.name}</h3>
                      <p className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${assetTypeColors[asset.asset_type]}`}>
                        {asset.asset_type.replace("_", " ")}
                      </p>
                    </div>
                    <button
                      onClick={() => favoriteMutation.mutate(asset.id)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Star className={`w-4 h-4 ${asset.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
                    </button>
                  </div>
                  
                  {asset.category && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Folder className="w-3 h-3" /> {asset.category}
                    </p>
                  )}
                  
                  {asset.tags && asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {asset.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <a
                      href={asset.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs bg-blue-50 text-blue-600 py-1.5 rounded text-center hover:bg-blue-100 transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => deleteMutation.mutate(asset.id)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No assets found</p>
          </div>
        )}
      </div>
    </div>
  );
}