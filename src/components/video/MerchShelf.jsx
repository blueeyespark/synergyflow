import { useState } from "react";
import { ShoppingBag, Plus, Trash2, ExternalLink, Star } from "lucide-react";
import { motion } from "framer-motion";

const DEMO_PRODUCTS = [
  { id: 1, name: "Channel Logo Hoodie", price: 39.99, image: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=200&h=200&fit=crop", rating: 4.8, sold: 234, url: "#" },
  { id: 2, name: "Streamer Mug", price: 14.99, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=200&h=200&fit=crop", rating: 4.9, sold: 892, url: "#" },
  { id: 3, name: "Gaming Mouse Pad XL", price: 24.99, image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=200&h=200&fit=crop", rating: 4.7, sold: 456, url: "#" },
];

export default function MerchShelf({ isOwner = false }) {
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [adding, setAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", image: "", url: "" });

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    setProducts(prev => [...prev, { ...newProduct, id: Date.now(), price: parseFloat(newProduct.price), rating: 5.0, sold: 0 }]);
    setAdding(false);
    setNewProduct({ name: "", price: "", image: "", url: "" });
  };

  const remove = (id) => setProducts(prev => prev.filter(p => p.id !== id));

  return (
    <div className="border-t border-gray-200 dark:border-zinc-800 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Merch</h3>
        </div>
        {isOwner && (
          <button onClick={() => setAdding(!adding)} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            {adding ? "Cancel" : "+ Add Product"}
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 mb-3 space-y-2">
          <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="Product name" className="w-full bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-xs rounded-lg px-3 py-2 border border-gray-200 dark:border-zinc-600 outline-none" />
          <input value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="Price (e.g. 29.99)" type="number" className="w-full bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-xs rounded-lg px-3 py-2 border border-gray-200 dark:border-zinc-600 outline-none" />
          <input value={newProduct.image} onChange={e => setNewProduct(p => ({ ...p, image: e.target.value }))} placeholder="Image URL (optional)" className="w-full bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-xs rounded-lg px-3 py-2 border border-gray-200 dark:border-zinc-600 outline-none" />
          <input value={newProduct.url} onChange={e => setNewProduct(p => ({ ...p, url: e.target.value }))} placeholder="Product URL (store link)" className="w-full bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-xs rounded-lg px-3 py-2 border border-gray-200 dark:border-zinc-600 outline-none" />
          <button onClick={addProduct} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg transition-colors">Add to Shelf</button>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {products.map((product, i) => (
          <motion.div key={product.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="flex-shrink-0 w-32 group relative">
            <div className="relative aspect-square bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden mb-1.5">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                </div>
              )}
              {isOwner && (
                <button onClick={() => remove(product.id)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 transition-opacity">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <p className="text-gray-900 dark:text-white text-xs font-medium line-clamp-2 leading-tight">{product.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
              <span className="text-gray-500 dark:text-zinc-400 text-xs">{product.rating}</span>
            </div>
            <p className="text-gray-900 dark:text-white font-bold text-sm mt-0.5">${product.price}</p>
            <a href={product.url || "#"} target="_blank" rel="noopener noreferrer"
              className="mt-1.5 flex items-center justify-center gap-1 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold py-1.5 rounded-lg hover:opacity-80 transition-opacity w-full">
              Buy <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </motion.div>
        ))}
        {products.length === 0 && (
          <p className="text-gray-400 dark:text-zinc-500 text-xs py-4">No products added yet</p>
        )}
      </div>
    </div>
  );
}