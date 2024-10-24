"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Inter } from "next/font/google";
import { supabase } from "@/utils/supabase";
import { ClientList } from "./components/ClientList";
import { AddClientForm } from "./components/AddClientForm";
import { EditClientForm } from "./components/EditClientForm";
import { ClientStatistics } from "./components/ClientStatistics";
import { Sidebar } from "./components/Sidebar";
import { Client, NewClient } from "./types"; // Ajout de l'import du type Client

const inter = Inter({ subsets: ["latin"] });

const ITEMS_PER_PAGE = 10;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState("list");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const loadClients = useCallback(
    async (page: number) => {
      try {
        const { data, error, count } = await supabase
          .from("clients")
          .select("*", { count: "exact" })
          .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
          .order("name", { ascending: true });

        if (error) throw error;

        setClients(data || []);
        if (count) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        }
      } catch (error) {
        console.error("Error loading clients:", error);
        toast({
          title: "Erreur",
          content: "Impossible de charger les clients. Veuillez réessayer.",
          variant: "destructive",
        });
      } finally {
        setIsLoaded(true);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadClients(currentPage);
  }, [loadClients, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);

      if (error) throw error;

      setClients(clients.filter((client) => client.id !== id));
      toast({
        title: "Succès",
        content: "Le client a été supprimé avec succès.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Erreur",
        content: "Impossible de supprimer le client. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleAddClient = async (newClient: NewClient) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert([newClient])
        .select();

      if (error) throw error;

      if (data) {
        setClients([...clients, data[0]]);
        toast({
          title: "Succès",
          content: `Le client ${data[0].name} a été ajouté avec succès.`,
          variant: "default",
        });
        setActiveTab("list");
      }
    } catch (error) {
      console.error("Error adding client:", error);
      toast({
        title: "Erreur",
        content: "Impossible d'ajouter le client. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update(updatedClient)
        .eq("id", updatedClient.id);

      if (error) throw error;

      setClients(
        clients.map((client) =>
          client.id === updatedClient.id ? updatedClient : client
        )
      );
      toast({
        title: "Succès",
        content: `Le client ${updatedClient.name} a été mis à jour avec succès.`,
        variant: "default",
      });
      setEditingClient(null);
      setActiveTab("list");
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        title: "Erreur",
        content: "Impossible de mettre à jour le client. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-4 ${inter.className}`}>
      <h1 className="text-3xl font-bold mb-6">Gestion des Clients</h1>

      <div className="flex gap-6">
        <div className="w-64">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="flex-1">
          {activeTab === "list" && clients.length > 0 ? (
            <ClientList
              clients={clients}
              onEditClient={(client: Client) => {
                setEditingClient(client);
                setActiveTab("edit");
              }}
              onDeleteClient={handleDeleteClient}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          ) : activeTab === "list" ? (
            <p>Aucun client trouvé.</p>
          ) : null}
          {activeTab === "add" && (
            <AddClientForm onAddClient={handleAddClient} />
          )}

          {activeTab === "edit" && editingClient && (
            <EditClientForm
              client={editingClient}
              onUpdateClient={handleUpdateClient}
              onCancel={() => {
                setEditingClient(null);
                setActiveTab("list");
              }}
            />
          )}

          {activeTab === "stats" && <ClientStatistics clients={clients} />}
        </div>
      </div>
    </div>
  );
}
