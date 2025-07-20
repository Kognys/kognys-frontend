import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [chats, setChats] = useState(() => chatStore.getAllChats());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const groupedChats = chatStore.getGroupedChats();

  const handleNewChat = () => {
    const newChat = chatStore.createChat();
    setChats(chatStore.getAllChats());
    navigate(`/chat/${newChat.id}`);
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
        "fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-200 ease-in-out",
        "md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="font-medium text-sm text-gray-900 dark:text-gray-100">Kognys</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="md:hidden h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button 
            onClick={handleNewChat}
            className="w-full justify-start gap-2 h-9 text-sm font-normal"
            variant="ghost"
            size="sm"
          >
            <PlusCircle className="h-4 w-4" />
            New chat
          </Button>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-4">
            {Object.entries(groupedChats).map(([group, groupChats]) => (
              <div key={group}>
                <h3 className="text-xs font-medium text-muted-foreground/80 px-2 mb-2">
                  {group}
                </h3>
                <div className="space-y-0.5">
                  {groupChats.map((chat) => (
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
                </div>
              </div>
            ))}
            
            {Object.keys(groupedChats).length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground/70">No conversations yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
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
      "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors relative",
      isActive && "bg-accent/70"
    )}>
      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
      
      {isEditing ? (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-sm"
          autoFocus
        />
      ) : (
        <button
          onClick={onNavigate}
          className="flex-1 text-left truncate text-foreground/90 text-sm font-normal hover:text-foreground"
        >
          {chat.title}
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-xs">
            <Edit3 className="h-3 w-3 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-xs text-red-600">
            <Trash2 className="h-3 w-3 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}