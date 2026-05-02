import { useState } from "react";
import { ShoppingBag, Plus, Trash2, Edit3, BarChart3 } from "lucide-react";

export default function MerchShelfStudio() {
  const [products, setProducts] = useState([
    { id: 1, name: "Channel Logo Hoodie", price: 49.99, inventory: 145, sales: 342, image: "🎀" },
    { id: 2, name: "Streamer Cap", price: 24.99, inventory: 89, sales: 156, image: "🧢" },
    { id: 3, name: "Custom Mousepad", price: 19.99, inventory: 201, sales: 78, image: "🖱️" },
  ]);

  const totalRevenue = products.reduce((sum, p) => sum + (p.sales * p.price), 0);
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);

  return (
    <div className="space-y-6">
      {/* Merch Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sales", value: totalSales, color: "text-green-400" },
          { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "text-blue-400" },
          { label: "Active Products", value: products.length, color: "text-purple-400" },
          { label: "Avg Price", value: `$${(totalRevenue / totalSales).toFixed(2)}`, color: "text-cyan-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
            <p className="text-xs text-blue-400/60 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Product Catalog */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-[#e8f4ff] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Your Merch Catalog
          </h2>
          <button className="flex items-center gap-2 bg-[#1e78ff] hover:bg-[#3d8fff] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-[#060d18] border border-blue-900/40 rounded-xl overflow-hidden hover:border-[#1e78ff]/40 transition-colors">
              {/* Product Image */}
              <div className="aspect-square bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center text-6xl">
                {p.image}
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-bold text-[#e8f4ff]">{p.name}</p>
                  <p className="text-lg font-black text-blue-400">${p.price}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0a1525] rounded-lg p-2">
                    <p className="text-xs text-blue-400/60">Sales</p>
                    <p className="text-sm font-bold text-[#c8dff5]">{p.sales}</p>
                  </div>
                  <div className="bg-[#0a1525] rounded-lg p-2">
                    <p className="text-xs text-blue-400/60">Stock</p>
                    <p className="text-sm font-bold text-[#c8dff5]">{p.inventory}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1 bg-blue-900/20 text-blue-300 hover:bg-blue-900/40 py-2 rounded-lg text-xs font-semibold transition-colors">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 bg-red-900/20 text-red-300 hover:bg-red-900/40 py-2 rounded-lg text-xs font-semibold transition-colors">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Merch Platform Integration */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Partner Platforms
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: "Teespring", status: "connected", products: "12" },
            { name: "Printful", status: "connected", products: "8" },
            { name: "Spreadshop", status: "not_connected", products: "0" },
          ].map((plat, i) => (
            <div key={i} className="p-3 bg-[#060d18] border border-blue-900/40 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#c8dff5]">{plat.name}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  plat.status === "connected" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
                }`}>
                  {plat.status === "connected" ? "Connected" : "Disconnected"}
                </span>
              </div>
              <p className="text-xs text-blue-400/60">{plat.products} products synced</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}