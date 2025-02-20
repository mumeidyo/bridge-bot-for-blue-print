import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertBridgeSchema } from "@shared/schema";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";

export default function Bridges() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: bridges, isLoading } = useQuery({
    queryKey: ["/api/bridges"],
  });

  const form = useForm({
    resolver: zodResolver(insertBridgeSchema),
    defaultValues: {
      discordChannelId: "",
      revoltChannelId: "",
      enabled: true,
    },
  });

  const createBridge = useMutation({
    mutationFn: api.createBridge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bridges"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Bridge created",
        description: "The bridge has been created successfully.",
      });
    },
  });

  const updateBridge = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<typeof form.getValues>) =>
      api.updateBridge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bridges"] });
      toast({
        title: "Bridge updated",
        description: "The bridge has been updated successfully.",
      });
    },
  });

  const deleteBridge = useMutation({
    mutationFn: api.deleteBridge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bridges"] });
      toast({
        title: "Bridge deleted",
        description: "The bridge has been deleted successfully.",
      });
    },
  });

  function onSubmit(data: typeof form.getValues) {
    createBridge.mutate(data);
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bridge Management</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Bridge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Bridge</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="discordChannelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discord Channel ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter Discord channel ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="revoltChannelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revolt Channel ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter Revolt channel ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createBridge.isPending}>
                  Create Bridge
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Discord Channel</TableHead>
            <TableHead>Revolt Channel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bridges?.map((bridge) => (
            <TableRow key={bridge.id}>
              <TableCell>{bridge.discordChannelId}</TableCell>
              <TableCell>{bridge.revoltChannelId}</TableCell>
              <TableCell>
                <Switch
                  checked={bridge.enabled}
                  onCheckedChange={(checked) =>
                    updateBridge.mutate({ id: bridge.id, enabled: checked })
                  }
                />
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Bridge</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this bridge? This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <Button
                        variant="destructive"
                        onClick={() => deleteBridge.mutate(bridge.id)}
                      >
                        Delete
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
