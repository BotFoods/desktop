import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaUndo, FaPlus, FaUser, FaUserPlus, FaLock, FaEnvelope, FaIdCard, FaUserTie } from 'react-icons/fa';
import { useAuth } from '../services/AuthContext';
import Modal from './Modal';

const PessoaCadastro = () => {
    const { validateSession, token, user } = useAuth();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [funcao, setFuncao] = useState('1');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [usuarios, setUsuarios] = useState([]);
    const [funcoes, setFuncoes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const loggedUser = user;
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        validateSession();
    }, [validateSession]);

    useEffect(() => {
        const fetchUsuarios = async () => {
            if (!token) {
                console.error('Token is missing or invalid.');
                return;
            }

            setLoading(true);
            const options = {
                method: 'GET',
                headers: {
                    authorization: `${token}`
                },
                credentials: 'include'
            };            try {
                const response = await fetch(`${API_BASE_URL}/api/usuarios?id_loja=${user.loja_id}`, options);
                if (response.ok) {
                    const data = await response.json();
                    setUsuarios(data.usuarios.filter(usuario => usuario.id !== loggedUser.id));
                } else {
                    console.error(`Error fetching users: ${response.status} ${response.statusText}`);
                    showMessage('Erro ao carregar usuários', 'error');
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                showMessage('Erro ao carregar usuários', 'error');
            } finally {
                setLoading(false);
            }
        };

        const fetchFuncoes = async () => {
            if (!token) {
                console.error('Token is missing or invalid.');
                return;
            }

            setLoading(true);
            const options = {
                method: 'GET',
                headers: {
                    authorization: `${token}`
                },
                credentials: 'include'
            };            try {
                const response = await fetch(`${API_BASE_URL}/api/funcoes?id_loja=${user.loja_id}`, options);
                if (response.ok) {
                    const data = await response.json();
                    setFuncoes(data);
                } else {
                    console.error(`Error fetching roles: ${response.status} ${response.statusText}`);
                    showMessage('Erro ao carregar funções', 'error');
                }
            } catch (error) {
                console.error('Error fetching roles:', error);
                showMessage('Erro ao carregar funções', 'error');
            } finally {
                setLoading(false);
            }
        };        if (token && user?.loja_id) {
            fetchUsuarios();
            fetchFuncoes();
        } else {
            showMessage('Token não disponível. Faça login novamente.', 'error');
        }
    }, [token, loggedUser, API_BASE_URL, user?.loja_id]);

    const showMessage = (text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
        }, 5000);
    };

    const validateForm = () => {
        if (!nome.trim()) {
            showMessage('Nome é obrigatório', 'error');
            return false;
        }
        if (!email.trim()) {
            showMessage('Email é obrigatório', 'error');
            return false;
        }
        if (!validateEmail(email)) {
            showMessage('Email inválido', 'error');
            return false;
        }
        if (!usuario.trim()) {
            showMessage('Usuário é obrigatório', 'error');
            return false;
        }
        if (!senha.trim()) {
            showMessage('Senha é obrigatória', 'error');
            return false;
        }
        if (senha.length < 6) {
            showMessage('Senha deve ter pelo menos 6 caracteres', 'error');
            return false;
        }
        return true;
    };

    const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authorization: `${token}`
            },
            credentials: 'include',
            body: JSON.stringify({
                nome,
                email,
                usuario,
                senha,
                funcao_id: funcao,
                loja_id: loggedUser.loja_id
            })
        };        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/cadastrar?id_loja=${user.loja_id}`, options);
            const data = await response.json();
            
            if (data.success) {
                const novoUsuario = { 
                    id: data.id, 
                    nome, 
                    email, 
                    usuario, 
                    funcao_id: funcao,
                    status: 1
                };
                setUsuarios([...usuarios, novoUsuario]);
                setNome('');
                setEmail('');
                setUsuario('');
                setSenha('');
                setFuncao('1');
                showMessage(data.message || 'Usuário cadastrado com sucesso!');
                setIsFormModalOpen(false);
            } else {
                showMessage(data.message || 'Erro ao cadastrar usuário', 'error');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            showMessage('Erro ao cadastrar usuário', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditUsuario = (index) => {
        const userToEdit = usuariosAtivos[index];
        setEditUser({
            id: userToEdit.id,
            nome: userToEdit.nome,
            email: userToEdit.email,
            usuario: userToEdit.usuario,
            funcao_id: userToEdit.funcao_id
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editUser.nome.trim()) {
            showMessage('Nome é obrigatório', 'error');
            return;
        }
        if (!editUser.email.trim()) {
            showMessage('Email é obrigatório', 'error');
            return;
        }
        if (!validateEmail(editUser.email)) {
            showMessage('Email inválido', 'error');
            return;
        }
        if (!editUser.usuario.trim()) {
            showMessage('Usuário é obrigatório', 'error');
            return;
        }

        setLoading(true);

        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                authorization: `${token}`
            },
            credentials: 'include',
            body: JSON.stringify({
                id: editUser.id,
                nome: editUser.nome,
                email: editUser.email,
                usuario: editUser.usuario,
                funcao_id: editUser.funcao_id
            })
        };        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/atualizar/${editUser.id}?id_loja=${user.loja_id}`, options);
            const data = await response.json();
            
            if (data.success) {
                setUsuarios(usuarios.map(user => 
                    user.id === editUser.id 
                        ? { ...user, ...editUser } 
                        : user
                ));
                showMessage('Usuário atualizado com sucesso!');
                setIsEditModalOpen(false);
            } else {
                showMessage(data.message || 'Erro ao atualizar usuário', 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showMessage('Erro ao atualizar usuário', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUsuario = async (id) => {
        if (!window.confirm('Tem certeza que deseja desativar este usuário?')) {
            return;
        }

        setLoading(true);
        const options = {
            method: 'GET',
            headers: {
                authorization: `${token}`
            },
            credentials: 'include'
        };        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/desativar/${id}?id_loja=${user.loja_id}`, options);
            const data = await response.json();
            
            if (data.success) {
                setUsuarios(usuarios.map(user => 
                    user.id === id ? { ...user, status: 0 } : user
                ));
                showMessage('Usuário desativado com sucesso!');
            } else {
                showMessage(data.message || 'Erro ao desativar usuário', 'error');
            }
        } catch (error) {
            console.error('Error deactivating user:', error);
            showMessage('Erro ao desativar usuário', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleActiveUsuario = async (id) => {
        setLoading(true);
        const options = {
            method: 'GET',
            headers: {
                authorization: `${token}`
            },
            credentials: 'include'
        };        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/ativar/${id}?id_loja=${user.loja_id}`, options);
            const data = await response.json();
            
            if (data.success) {
                setUsuarios(usuarios.map(user => 
                    user.id === id ? { ...user, status: 1 } : user
                ));
                showMessage('Usuário reativado com sucesso!');
            } else {
                showMessage(data.message || 'Erro ao reativar usuário', 'error');
            }
        } catch (error) {
            console.error('Error reactivating user:', error);
            showMessage('Erro ao reativar usuário', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openFormModal = () => {
        setNome('');
        setEmail('');
        setUsuario('');
        setSenha('');
        setFuncao('1');
        setIsFormModalOpen(true);
    };

    const usuariosAtivos = usuarios.filter(user => user.status === 1);
    const usuariosInativos = usuarios.filter(user => user.status === 0);

    return (
        <>
            <div className="mb-6 flex justify-between items-center">
                <h3 className="text-xl font-bold relative">
                    <span className="relative inline-block">
                        Gerenciamento de Usuários
                        <span className="absolute -top-1 -right-6 bg-blue-500 text-xs text-white py-1 px-2 rounded-full">
                            {usuarios.length}
                        </span>
                    </span>
                </h3>
                
                <button 
                    onClick={openFormModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                    <FaPlus />
                    <span>Novo Usuário</span>
                </button>
            </div>
            
            <Modal 
                isOpen={isFormModalOpen} 
                onClose={() => setIsFormModalOpen(false)} 
                title="Novo Usuário" 
                icon={<FaUserPlus />}
                width="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1">
                            Nome <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaUser className="text-gray-400" />
                            </div>
                            <input
                                id="nome"
                                type="text"
                                placeholder="Nome completo"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    <div className="relative">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaEnvelope className="text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                placeholder="exemplo@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    
                    <div className="relative">
                        <label htmlFor="usuario" className="block text-sm font-medium text-gray-300 mb-1">
                            Nome de usuário <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaIdCard className="text-gray-400" />
                            </div>
                            <input
                                id="usuario"
                                type="text"
                                placeholder="Nome de usuário"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    
                    <div className="relative">
                        <label htmlFor="senha" className="block text-sm font-medium text-gray-300 mb-1">
                            Senha <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaLock className="text-gray-400" />
                            </div>
                            <input
                                id="senha"
                                type="password"
                                placeholder="Senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    
                    <div className="relative">
                        <label htmlFor="funcao" className="block text-sm font-medium text-gray-300 mb-1">
                            Função <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaUserTie className="text-gray-400" />
                            </div>
                            <select
                                id="funcao"
                                value={funcao}
                                onChange={(e) => setFuncao(e.target.value)}
                                className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 appearance-none"
                                disabled={loading}
                            >
                                <option value="">Selecione uma função</option>
                                {funcoes.map(funcao => (
                                    <option key={funcao.id} value={funcao.id}>{funcao.descricao}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className={`w-full p-3 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            loading 
                            ? 'bg-gray-600 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                        } text-white font-bold`}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Cadastrando...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <FaPlus className="mr-2" />
                                Cadastrar Usuário
                            </span>
                        )}
                    </button>
                </form>
                {message && (
                    <div className={`mt-4 p-3 rounded-lg text-center transition-all duration-300 ${
                        messageType === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                    }`}>
                        {message}
                    </div>
                )}
            </Modal>
            
            <div className="w-full mt-8">                
                <h3 className="text-xl font-bold mb-6 text-center relative">
                    <span className="relative inline-block">
                        Lista de Usuários Ativos
                        <span className="absolute -top-1 -right-6 bg-green-500 text-xs text-white py-1 px-2 rounded-full">
                            {usuariosAtivos.length}
                        </span>
                    </span>
                </h3>
                
                {loading && usuarios.length === 0 ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : usuariosAtivos.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                        <p>Nenhum usuário ativo encontrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow">
                        <table className="min-w-full bg-gray-800 text-white rounded-lg overflow-hidden">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="py-3 px-4 text-left border-b border-gray-600">Nome</th>
                                    <th className="py-3 px-4 text-left border-b border-gray-600">Email</th>
                                    <th className="py-3 px-4 text-left border-b border-gray-600">Usuário</th>
                                    <th className="py-3 px-4 text-left border-b border-gray-600">Função</th>
                                    <th className="py-3 px-4 text-center border-b border-gray-600">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuariosAtivos.map((user, index) => (
                                    <tr 
                                        key={user.id}
                                        className="hover:bg-gray-700 transition-colors duration-150"
                                    >
                                        <td className="py-3 px-4 border-b border-gray-700">{user.nome}</td>
                                        <td className="py-3 px-4 border-b border-gray-700">{user.email}</td>
                                        <td className="py-3 px-4 border-b border-gray-700">{user.usuario}</td>
                                        <td className="py-3 px-4 border-b border-gray-700">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                user.funcao_id === 1 ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                                            }`}>
                                                {funcoes.find(f => f.id === user.funcao_id)?.descricao || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 border-b border-gray-700 flex justify-center gap-2">
                                            <button 
                                                onClick={() => handleEditUsuario(index)} 
                                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-200"
                                                title="Editar usuário"
                                                disabled={loading}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUsuario(user.id)} 
                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200"
                                                title="Desativar usuário"
                                                disabled={loading}
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <div className="w-full mt-12 mb-4">
                <h3 className="text-xl font-bold mb-6 text-center relative">
                    <span className="relative inline-block">
                        Usuários Inativos
                        <span className="absolute -top-1 -right-6 bg-gray-500 text-xs text-white py-1 px-2 rounded-full">
                            {usuariosInativos.length}
                        </span>
                    </span>
                </h3>
                
                {usuariosInativos.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                        <p>Nenhum usuário inativo.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow">
                        <table className="min-w-full bg-gray-800 text-gray-400 rounded-lg overflow-hidden">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="py-3 px-4 text-left border-b border-gray-600">Nome</th>
                                    <th className="py-3 px-4 text-left border-b border-gray-600">Email</th>
                                    <th className="py-3 px-4 text-left border-b border-gray-600">Usuário</th>
                                    <th className="py-3 px-4 text-left border-b border-gray-600">Função</th>
                                    <th className="py-3 px-4 text-center border-b border-gray-600">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuariosInativos.map((user) => (
                                    <tr 
                                        key={user.id}
                                        className="hover:bg-gray-700 transition-colors duration-150 italic"
                                    >
                                        <td className="py-3 px-4 border-b border-gray-700">{user.nome}</td>
                                        <td className="py-3 px-4 border-b border-gray-700">{user.email}</td>
                                        <td className="py-3 px-4 border-b border-gray-700">{user.usuario}</td>
                                        <td className="py-3 px-4 border-b border-gray-700">
                                            {funcoes.find(f => f.id === user.funcao_id)?.descricao || 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 border-b border-gray-700 flex justify-center">
                                            <button 
                                                onClick={() => handleActiveUsuario(user.id)} 
                                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200"
                                                title="Reativar usuário"
                                                disabled={loading}
                                            >
                                                <FaUndo />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isEditModalOpen && editUser && (
                <Modal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    title="Editar Usuário" 
                    icon={<FaEdit />}
                    width="max-w-lg"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Nome <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaUser className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={editUser.nome || ''}
                                    onChange={(e) => setEditUser({ ...editUser, nome: e.target.value })}
                                    placeholder="Nome completo"
                                    className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaEnvelope className="text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={editUser.email || ''}
                                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                    placeholder="exemplo@email.com"
                                    className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Nome de usuário <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaIdCard className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={editUser.usuario || ''}
                                    onChange={(e) => setEditUser({ ...editUser, usuario: e.target.value })}
                                    placeholder="Nome de usuário para login"
                                    className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Função <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={editUser.funcao_id}
                                onChange={(e) => setEditUser({ ...editUser, funcao_id: e.target.value })}
                                className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                disabled={loading || funcoes.length === 0}
                            >
                                {funcoes.map((funcao) => (
                                    <option key={funcao.id} value={funcao.id}>{funcao.descricao}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex space-x-3 pt-2">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-1/2 p-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors duration-200"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                className={`w-1/2 p-3 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                    loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                                } text-white font-bold`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Salvando...
                                    </span>
                                ) : (
                                    <span>Salvar</span>
                                )}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default PessoaCadastro;
