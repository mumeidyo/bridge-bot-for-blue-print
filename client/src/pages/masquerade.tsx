import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertMasqueradeSchema } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, User, Trash2 } from "lucide-react";

export default function Masquerade() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: bridges } = useQuery({
    queryKey: ["/api/bridges"],
  });

  const form = useForm({
    resolver: zodResolver(insertMasqueradeSchema),
    defaultValues: {
      bridgeId: 0,
      userId: "",
      username: "",
      avatar: "",
      enabled: true,
    },
  });

  const { data: masquerades } = useQuery({
    queryKey: ["/api/bridges", form.watch("bridgeId"), "masquerades"],
    enabled: !!form.watch("bridgeId"),
  });

  const createMasquerade = useMutation({
    mutationFn: api.createMasquerade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bridges"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Masquerade created",
        description: "The masquerade has been created successfully.",
      });
    },
  });

  const updateMasquerade = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<typeof form.getValues>) =>
      api.updateMasquerade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bridges"] });
      toast({
        title: "Masquerade updated",
        description: "The masquerade has been updated successfully.",
      });
    },
  });

  const deleteMasquerade = useMutation({
    mutationFn: api.deleteMasquerade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bridges"] });
      toast({
        title: "Masquerade deleted",
        description: "The masquerade has been deleted successfully.",
      });
    },
  });

  function onSubmit(data: typeof form.getValues) {
    createMasquerade.mutate(data);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Masquerade Management</h2>
          <p className="text-muted-foreground">
            Manage user appearances across bridges
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Masquerade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Masquerade</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="bridgeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bridge</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a bridge" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bridges?.map((bridge) => (
                            <SelectItem key={bridge.id} value={bridge.id.toString()}>
                              {bridge.discordChannelId} → {bridge.revoltChannelId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter user ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter display name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter avatar URL" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createMasquerade.isPending}>
                  Create Masquerade
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {masquerades?.map((masquerade) => (
          <Card key={masquerade.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {masquerade.username}
              </CardTitle>
              <Switch
                checked={masquerade.enabled}
                onCheckedChange={(checked) =>
                  updateMasquerade.mutate({ id: masquerade.id, enabled: checked })
                }
              />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={masquerade.avatar} />
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <CardDescription>User ID: {masquerade.userId}</CardDescription>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMasquerade.mutate(masquerade.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
