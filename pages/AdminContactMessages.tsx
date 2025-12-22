import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Mail, Trash2, Check, ChevronLeft, Filter, X, Plus } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { getCurrentUser } from '../utils/auth';

interface Message {
  id: number;
  aderente_id: number;
  aderente_name: string;
  aderente_email: string;
  department_id: number;
  department_name: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: number;
  name: string;
}

export const AdminContactMessages: React.FC = () => {
  const navigate = useNavigate();
  const { show } = useToast();
  const currentUser = getCurrentUser();
  const { messageId } = useParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('unread');
  const [filterDepartment, setFilterDepartment] = useState<number | 'all'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [showNewDepartment, setShowNewDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  
  // Department management states
  const [viewMode, setViewMode] = useState<'messages' | 'departments'>('messages');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [showDeleteDepartmentConfirm, setShowDeleteDepartmentConfirm] = useState(false);

  // Load messages and departments
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        navigate('/');
        return;
      }

      try {
        const [messagesRes, departmentsRes] = await Promise.all([
          fetch(`/api/admin-contacts/messages`),
          fetch(`/api/admin-contacts/departments`)
        ]);

        if (!messagesRes.ok || !departmentsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const messagesData = await messagesRes.json();
        const departmentsData = await departmentsRes.json();

        setMessages(messagesData);
        setDepartments(departmentsData);

        // If messageId is in URL, load that message
        if (messageId) {
          const msg = messagesData.find((m: Message) => m.id === parseInt(messageId));
          if (msg && !msg.read) {
            markAsRead(parseInt(messageId));
          }
          setSelectedMessage(msg || null);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        show('Não foi possível carregar as mensagens', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, navigate, show, messageId]);

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/admin-contacts/messages/${id}/read`, {
        method: 'PATCH'
      });
      if (response.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
        if (selectedMessage?.id === id) {
          setSelectedMessage(prev => prev ? { ...prev, read: true } : null);
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const response = await fetch(`/api/admin-contacts/messages/${messageToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete message');

      setMessages(prev => prev.filter(m => m.id !== messageToDelete));
      if (selectedMessage?.id === messageToDelete) {
        setSelectedMessage(null);
      }

      show('Mensagem eliminada', 'success');
    } catch (error) {
      console.error('Error deleting message:', error);
      show('Não foi possível eliminar a mensagem', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setMessageToDelete(null);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) return;

    setCreatingDepartment(true);
    try {
      const response = await fetch('/api/admin-contacts/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newDepartmentName })
      });

      if (!response.ok) throw new Error('Failed to create department');

      const newDept = await response.json();
      setDepartments(prev => [...prev, newDept]);
      setNewDepartmentName('');
      setShowNewDepartment(false);

      show('Departamento criado com sucesso', 'success');
    } catch (error) {
      console.error('Error creating department:', error);
      show('Não foi possível criar o departamento', 'error');
    } finally {
      setCreatingDepartment(false);
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartment || !editingDepartment.name.trim()) return;

    try {
      const response = await fetch(`/api/admin-contacts/departments/${editingDepartment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: editingDepartment.name })
      });

      if (!response.ok) throw new Error('Failed to update department');

      const updatedDept = await response.json();
      setDepartments(prev => prev.map(d => d.id === updatedDept.id ? updatedDept : d));
      setEditingDepartment(null);

      show('Departamento atualizado com sucesso', 'success');
    } catch (error) {
      console.error('Error updating department:', error);
      show('Não foi possível atualizar o departamento', 'error');
    }
  };

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    try {
      const response = await fetch(`/api/admin-contacts/departments/${departmentToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error?.includes('existing messages')) {
          show('Não é possível eliminar departamento com mensagens', 'error');
        } else {
          throw new Error('Failed to delete department');
        }
        return;
      }

      setDepartments(prev => prev.filter(d => d.id !== departmentToDelete.id));
      show('Departamento eliminado', 'success');
    } catch (error) {
      console.error('Error deleting department:', error);
      show('Não foi possível eliminar o departamento', 'error');
    } finally {
      setShowDeleteDepartmentConfirm(false);
      setDepartmentToDelete(null);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const readFilter = filterRead === 'all' || (filterRead === 'unread' && !msg.read) || (filterRead === 'read' && msg.read);
    const deptFilter = filterDepartment === 'all' || msg.department_id === filterDepartment;
    return readFilter && deptFilter;
  });

  const unreadCount = messages.filter(m => !m.read).length;

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-6 w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {selectedMessage ? (
          // Message Detail View
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedMessage(null)}
                className="flex items-center gap-2 text-mousquetaires hover:text-mousquetaires/80 font-medium"
              >
                <ChevronLeft size={20} />
                Voltar para Mensagens
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMessageToDelete(selectedMessage.id);
                  setShowDeleteConfirm(true);
                }}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Eliminar
              </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {/* Message Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedMessage.department_name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      De: <span className="font-medium">{selectedMessage.aderente_name}</span> ({selectedMessage.aderente_email})
                    </p>
                  </div>
                  {!selectedMessage.read && (
                    <Button
                      size="sm"
                      onClick={() => markAsRead(selectedMessage.id)}
                      className="flex items-center gap-2"
                    >
                      <Check size={16} />
                      Marcar como Lida
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(selectedMessage.created_at).toLocaleString('pt-PT')}
                </p>
              </div>

              {/* Message Content */}
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Messages List View
          <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setViewMode('messages')}
                  className={`${
                    viewMode === 'messages'
                      ? 'border-mousquetaires text-mousquetaires'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Mensagens
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setViewMode('departments')}
                  className={`${
                    viewMode === 'departments'
                      ? 'border-mousquetaires text-mousquetaires'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Departamentos
                  <span className="ml-2 text-gray-400">({departments.length})</span>
                </button>
              </nav>
            </div>

            {viewMode === 'messages' ? (
              // Messages View
              <>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensagens de Contacto</h1>
              <p className="text-gray-600">
                {unreadCount > 0 && (
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium mr-2">
                    {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                  </span>
                )}
                Total: {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>

              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value as 'all' | 'unread' | 'read')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mousquetaires focus:border-transparent"
              >
                <option value="unread">Não Lidas</option>
                <option value="read">Lidas</option>
                <option value="all">Todas</option>
              </select>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mousquetaires focus:border-transparent"
              >
                <option value="all">Todos os Departamentos</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setFilterRead('unread');
                  setFilterDepartment('all');
                }}
                className="text-sm text-mousquetaires hover:text-mousquetaires/80 font-medium"
              >
                Limpar filtros
              </button>

              <div className="flex-1"></div>

              <Button
                size="sm"
                onClick={() => setShowNewDepartment(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Novo Departamento
              </Button>
            </div>

            {/* Messages List */}
            {filteredMessages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Mail size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma mensagem</h3>
                <p className="text-gray-600">Não há mensagens com os filtros selecionados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMessages.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.read) {
                        markAsRead(msg.id);
                      }
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      msg.read
                        ? 'bg-white border-gray-100 hover:bg-gray-50'
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={`font-medium ${msg.read ? 'text-gray-700' : 'text-blue-900'}`}>
                            {msg.aderente_name}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {msg.department_name}
                          </span>
                          {!msg.read && (
                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{msg.aderente_email}</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{msg.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(msg.created_at).toLocaleString('pt-PT')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            ) : (
              // Departments View
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Departamentos</h1>
                    <p className="text-gray-600">
                      Total: {departments.length} departamento{departments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowNewDepartment(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Novo Departamento
                  </Button>
                </div>

                {/* Departments List */}
                <div className="space-y-3">
                  {departments.map(dept => (
                    <div
                      key={dept.id}
                      className="p-4 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      {editingDepartment?.id === dept.id ? (
                        // Edit Mode
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={editingDepartment.name}
                            onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-transparent"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleUpdateDepartment}
                            disabled={!editingDepartment.name.trim()}
                          >
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingDepartment(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{dept.name}</h3>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingDepartment({ ...dept })}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setDepartmentToDelete(dept);
                                setShowDeleteDepartmentConfirm(true);
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {departments.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                      <svg width="48" height="48" className="mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum departamento</h3>
                      <p className="text-gray-600 mb-4">Crie um novo departamento para começar</p>
                      <Button onClick={() => setShowNewDepartment(true)}>
                        <Plus size={16} className="mr-2" />
                        Criar Departamento
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* New Department Dialog */}
        {showNewDepartment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Novo Departamento</h2>
                <button
                  onClick={() => {
                    setShowNewDepartment(false);
                    setNewDepartmentName('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <input
                type="text"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                placeholder="Nome do departamento"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-transparent mb-4"
                autoFocus
              />

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewDepartment(false);
                    setNewDepartmentName('');
                  }}
                  disabled={creatingDepartment}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateDepartment}
                  disabled={creatingDepartment || !newDepartmentName.trim()}
                >
                  {creatingDepartment ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="Eliminar Mensagem"
          message="Tem a certeza que deseja eliminar esta mensagem? Esta ação não pode ser desfeita."
          confirmText="Eliminar"
          onCancel={() => {
            setShowDeleteConfirm(false);
            setMessageToDelete(null);
          }}
          onConfirm={handleDeleteMessage}
        />

        {/* Delete Department Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDepartmentConfirm}
          title="Eliminar Departamento"
          message={`Tem a certeza que deseja eliminar o departamento "${departmentToDelete?.name}"? Esta ação não pode ser desfeita.`}
          confirmText="Eliminar"
          onCancel={() => {
            setShowDeleteDepartmentConfirm(false);
            setDepartmentToDelete(null);
          }}
          onConfirm={handleDeleteDepartment}
        />
      </main>
    </div>
  );
};
