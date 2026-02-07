import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Filter, X, CalendarIcon, SortAsc, SortDesc, 
  ArrowUpDown, ChevronDown 
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function TaskFilters({ 
  filters, 
  onFiltersChange, 
  teamMembers,
  sortBy,
  sortOrder,
  onSortChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const activeFilterCount = [
    filters.assignee,
    filters.priority,
    filters.dueDateFrom,
    filters.dueDateTo
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      assignee: "",
      priority: "",
      dueDateFrom: "",
      dueDateTo: ""
    });
  };

  const sortOptions = [
    { value: "created_date", label: "Created Date" },
    { value: "due_date", label: "Due Date" },
    { value: "priority", label: "Priority" },
    { value: "title", label: "Title" },
    { value: "status", label: "Status" }
  ];

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filter Tasks</h4>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs">
                  Clear all
                </Button>
              )}
            </div>

            {teamMembers && teamMembers.length > 0 && (
              <div>
                <Label className="text-xs text-slate-500">Assignee</Label>
                <Select
                  value={filters.assignee || "all"}
                  onValueChange={(value) => onFiltersChange({ ...filters, assignee: value === "all" ? "" : value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="All assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All assignees</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((email) => (
                      <SelectItem key={email} value={email}>
                        {email.split('@')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-xs text-slate-500">Priority</Label>
              <Select
                value={filters.priority || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, priority: value === "all" ? "" : value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-500">Due Date Range</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                      <CalendarIcon className="w-3 h-3 mr-2" />
                      {filters.dueDateFrom ? format(new Date(filters.dueDateFrom), "MMM d") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dueDateFrom ? new Date(filters.dueDateFrom) : undefined}
                      onSelect={(date) => onFiltersChange({ 
                        ...filters, 
                        dueDateFrom: date?.toISOString().split('T')[0] || "" 
                      })}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                      <CalendarIcon className="w-3 h-3 mr-2" />
                      {filters.dueDateTo ? format(new Date(filters.dueDateTo), "MMM d") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dueDateTo ? new Date(filters.dueDateTo) : undefined}
                      onSelect={(date) => onFiltersChange({ 
                        ...filters, 
                        dueDateTo: date?.toISOString().split('T')[0] || "" 
                      })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpDown className="w-4 h-4" />
            Sort
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48" align="start">
          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Sort by</Label>
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value, sortBy === option.value && sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-slate-100 ${
                  sortBy === option.value ? 'bg-slate-100' : ''
                }`}
              >
                {option.label}
                {sortBy === option.value && (
                  sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.assignee && (
            <Badge variant="secondary" className="gap-1">
              {filters.assignee === "unassigned" ? "Unassigned" : filters.assignee.split('@')[0]}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, assignee: "" })}
              />
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="secondary" className="gap-1">
              {filters.priority}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, priority: "" })}
              />
            </Badge>
          )}
          {(filters.dueDateFrom || filters.dueDateTo) && (
            <Badge variant="secondary" className="gap-1">
              {filters.dueDateFrom && format(new Date(filters.dueDateFrom), "MMM d")}
              {filters.dueDateFrom && filters.dueDateTo && " - "}
              {filters.dueDateTo && format(new Date(filters.dueDateTo), "MMM d")}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, dueDateFrom: "", dueDateTo: "" })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}