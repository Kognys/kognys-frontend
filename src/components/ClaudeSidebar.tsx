import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PlusCircle, 
  MessageSquare, 
  MoreHorizontal, 
  Trash2,
  Edit3,
  Menu,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { chatStore, type Chat } from '@/lib/chatStore';
import { cn } from '@/lib/utils';

interface ClaudeSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ClaudeSidebar({ isOpen, onToggle }: ClaudeSidebarProps) {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [chats, setChats] = useState(() => chatStore.getAllChats());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const handleNewChat = () => {
    navigate('/chat');
    if (window.innerWidth < 768) {
      onToggle(); // Close sidebar on mobile after creating chat
    }
  };

  const handleDeleteChat = (id: string) => {
    setChatToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      chatStore.deleteChat(chatToDelete);
      setChats(chatStore.getAllChats());
      
      // If we're deleting the current chat, navigate to home
      if (chatToDelete === chatId) {
        navigate('/');
      }
    }
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    chatStore.updateChat(id, { title: newTitle });
    setChats(chatStore.getAllChats());
  };

  const recentChats = chats.slice(0, 20); // Show only recent 20 chats

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-background border-r border-border z-50 transform transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <img 
              src="/kognys-logo.png" 
              alt="Kognys Logo" 
              className="w-8 h-8 object-contain"
            />
            <h2 className="font-semibold text-lg text-foreground">Kognys</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="md:hidden h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button 
            onClick={handleNewChat}
            className="w-full justify-start gap-2 h-9 text-sm font-normal bg-transparent border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            variant="outline"
            size="sm"
          >
            <PlusCircle className="h-4 w-4" />
            New chat
          </Button>
        </div>

        {/* Recent Section */}
        {recentChats.length > 0 && (
          <div className="px-3 mb-2">
            <h3 className="text-xs font-medium text-muted-foreground px-2 mb-2">
              Recents
            </h3>
          </div>
        )}

        {/* Chat History */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-0.5">
            {recentChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === chatId}
                onDelete={() => handleDeleteChat(chat.id)}
                onRename={(newTitle) => handleRenameChat(chat.id, newTitle)}
                onNavigate={() => {
                  navigate(`/chat/${chat.id}`);
                  if (window.innerWidth < 768) {
                    onToggle();
                  }
                }}
              />
            ))}
            
            {recentChats.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Chat</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-muted-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onNavigate: () => void;
}

function ChatItem({ chat, isActive, onDelete, onRename, onNavigate }: ChatItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);

  const handleRename = () => {
    if (editTitle.trim() !== chat.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(chat.title);
      setIsEditing(false);
    }
  };

  return (
    <div className={cn(
      "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors relative",
      isActive && "bg-muted"
    )}>
      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      
      {isEditing ? (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-sm text-foreground"
          autoFocus
        />
      ) : (
        <button
          onClick={onNavigate}
          className="flex-1 text-left truncate text-muted-foreground text-sm font-normal hover:text-foreground"
        >
          {chat.title}
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32 bg-background border-border">
          <DropdownMenuItem 
            onClick={() => setIsEditing(true)} 
            className="text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Edit3 className="h-3 w-3 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onDelete} 
            className="text-xs text-red-400 hover:bg-muted hover:text-red-300"
          >
            <Trash2 className="h-3 w-3 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}