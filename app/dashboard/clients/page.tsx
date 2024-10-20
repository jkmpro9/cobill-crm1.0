"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast"
import { Inter } from 'next/font/google'
import { supabase } from '@/utils/supabase';
import { ClientList } from './components/ClientList';
import { AddClientForm } from './components/AddClientForm';
import { EditClientForm } from './components/EditClientForm';
import { ClientStatistics } from './components/ClientStatistics';
import { Sidebar } from './components/Sidebar';

const inter = Inter({ subsets: ['latin'] })

interface Client {
  id: string;
  custom_id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState('list');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast()

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*');

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients. Veuillez réessayer.",
      });
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(clients.filter(client => client.id !== id));
      toast({
        title: "Succès",
        description: "Le client a été supprimé avec succès.",
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le client. Veuillez réessayer.",
      });
    }
  };

  const handleAddClient = async (newClient: Omit<Client, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([newClient])
        .select();

      if (error) throw error;

      if (data) {
        setClients([...clients, data[0]]);
        toast({
          title: "Succès",
          description: `Le client ${data[0].name} a été ajouté avec succès.`,
        });
        setActiveTab('list');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le client. Veuillez réessayer.",
      });
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(updatedClient)
        .eq('id', updatedClient.id);

      if (error) throw error;

      setClients(clients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      ));
      toast({
        title: "Succès",
        description: `Le client ${updatedClient.name} a été mis à jour avec succès.`,
      });
      setEditingClient(null);
      setActiveTab('list');
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le client. Veuillez réessayer.",
      });
    }
  };

  return (
    <div className={`container mx-auto p-4 ${inter.className}`}>
      <h1 className="text-3xl font-bold mb-6">Gestion des Clients</h1>
      
      <div className="flex gap-6">
        <div className="w-64">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="flex-1">
          {activeTab === 'list' && (
            <ClientList 
              clients={clients} 
              onEditClient={(client) => {
                setEditingClient(client);
                setActiveTab('edit');
              }} 
              onDeleteClient={handleDeleteClient} 
            />
          )}

          {activeTab === 'add' && (
            <AddClientForm onAddClient={handleAddClient} />
          )}

          {activeTab === 'edit' && editingClient && (
            <EditClientForm 
              client={editingClient} 
              onUpdateClient={handleUpdateClient}
              onCancel={() => {
                setEditingClient(null);
                setActiveTab('list');
              }}
            />
          )}

          {activeTab === 'stats' && (
            <ClientStatistics clients={clients} />
          )}
        </div>
      </div>
    </div>
  );
}
