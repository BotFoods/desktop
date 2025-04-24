import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaUndo } from 'react-icons/fa';
import { useAuth } from '../services/AuthContext';

const PessoaCadastro = () => {
    const { validateSession, token, user } = useAuth();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [funcao, setFuncao] = useState('1');
    const [message, setMessage] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [funcoes, setFuncoes] = useState([]);
    const loggedUser = user;
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        validateSession();
    }, []);

    useEffect(() => {
        const fetchUsuarios = async () => {
            if (!token) {
                console.error('Token is missing or invalid.');
                return;
            }

            const options = {
                method: 'GET',
                headers: {
                    authorization: `${token}`
                },
                credentials: 'include'
            };

            try {
                const response = await fetch(`https://${API_BASE_URL}/api/usuarios`, options);
                if (response.ok) {
                    const data = await response.json();
                    setUsuarios(data.usuarios.filter(usuario => usuario.id !== loggedUser.id));
                } else {
                    console.error(`Error fetching users: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        const fetchFuncoes = async () => {
            if (!token) {
                console.error('Token is missing or invalid.');
                return;
            }

            const options = {
                method: 'GET',
                headers: {
                    authorization: `${token}`
                },
                credentials: 'include'
            };

            try {
                const response = await fetch(`https://${API_BASE_URL}/api/funcoes`, options);
                if (response.ok) {
                    const data = await response.json();
                    setFuncoes(data);
                } else {
                    console.error(`Error fetching roles: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error fetching roles:', error);
            }
        };

        if (token) {
            fetchUsuarios();
            fetchFuncoes();
        } else {
            console.error('Token is not available. Please log in again.');
        }
    }, [token, loggedUser]);

    useEffect(() => {
        document.getElementById('nome').focus();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        const options = {
            method: 'POST',
            headers: {
                'authorization': `${token}`,
                'content-type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                nome,
                email,
                usuario,
                senha,
                funcao_id: funcao,
                loja_id: '1'
            })
        };

        fetch(`https://${API_BASE_URL}/api/usuarios/cadastrar`, options)
            .then(response => response.json())
            .then(response => {
                setMessage(response.message);
                if (response.success) {
                    setUsuarios([...usuarios, { id: response.id, nome, email, usuario, senha, funcao_id: funcao, loja_id: '1', ativo: 1 }]);
                    setNome('');
                    setEmail('');
                    setUsuario('');
                    setSenha('');
                    setFuncao('1');
                }
            })
            .catch(err => console.error(err));
    };

    const handleDeleteUsuario = async (id) => {
        const options = {
            method: 'GET',
            headers: {
                authorization: `${token}`
            },
            credentials: 'include'
        };

        try {
            const response = await fetch(`https://${API_BASE_URL}/api/usuarios/desativar/${id}`, options);
            const data = await response.json();
            if (data.success) {
                setUsuarios((prevUsuarios) => prevUsuarios.map(user => user.id === id ? { ...user, ativo: 0 } : user));
            } else {
                console.error('Error deleting user:', data.message);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleActiveUsuario = async (id) => {
        const options = {
            method: 'GET',
            headers: {
                authorization: `${token}`
            },
            credentials: 'include'
        };

        try {
            const response = await fetch(`https://${API_BASE_URL}/api/usuarios/ativar/${id}`, options);
            const data = await response.json();
            if (data.success) {
                setUsuarios((prevUsuarios) => prevUsuarios.map(user => user.id === id ? { ...user, ativo: 1 } : user));
            } else {
                console.error('Error activating user:', data.message);
            }
        } catch (error) {
            console.error('Error activating user:', error);
        }
    };

    const handleEditUsuario = (index) => {
        const user = usuarios[index];
        const newNome = prompt('Edit User Name', user.nome);
        const newEmail = prompt('Edit User Email', user.email);
        const newUsuario = prompt('Edit User Username', user.usuario);
        const newSenha = prompt('Edit User Password', user.senha);
        const newFuncao = prompt('Edit User Role (1: Administrador, 2: Operador)', user.funcao_id);
        if (newNome && newEmail && newUsuario && newSenha && newFuncao) {
            setUsuarios((prevUsuarios) => {
                const updatedUsuarios = [...prevUsuarios];
                updatedUsuarios[index] = { ...user, nome: newNome, email: newEmail, usuario: newUsuario, senha: newSenha, funcao_id: newFuncao };
                return updatedUsuarios;
            });
        }
    };

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        id="nome"
                        type="text"
                        placeholder="Nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white"
                        autoFocus
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    />
                    <input
                        type="text"
                        placeholder="Usuário"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    />
                    <select
                        value={funcao}
                        onChange={(e) => setFuncao(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    >
                        {funcoes.map((funcao) => (
                            <option key={funcao.id} value={funcao.id}>{funcao.descricao}</option>
                        ))}
                    </select>
                    <button type="submit" className="w-full p-2 rounded bg-blue-600 text-white font-bold">
                        Cadastrar
                    </button>
                </form>
                {message && <p className="mt-4 text-green-500">{message}</p>}
            </div>
            <div className="w-full">
                <hr className="my-8 border-gray-700" />
                <h3 className="text-xl font-bold mb-4 text-center">Lista de Pessoas Ativas</h3>
                <table className="min-w-full bg-gray-800 text-white text-center">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b border-gray-700">Nome</th>
                            <th className="py-2 px-4 border-b border-gray-700">Email</th>
                            <th className="py-2 px-4 border-b border-gray-700">Usuário</th>
                            <th className="py-2 px-4 border-b border-gray-700">Função</th>
                            <th className="py-2 px-4 border-b border-gray-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.filter(user => user.ativo === 1).map((user, index) => (
                            <tr key={user.id}>
                                <td className="py-2 px-4 border-b border-gray-700">{user.nome}</td>
                                <td className="py-2 px-4 border-b border-gray-700">{user.email}</td>
                                <td className="py-2 px-4 border-b border-gray-700">{user.usuario}</td>
                                <td className="py-2 px-4 border-b border-gray-700">{funcoes.find(f => f.id === user.funcao_id)?.descricao}</td>
                                <td className="py-2 px-4 border-b border-gray-700">
                                    <button onClick={() => handleEditUsuario(index)} className="mr-2">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleDeleteUsuario(user.id)}>
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <hr className="my-8 border-gray-700" />
                <h3 className="text-xl font-bold mb-4 text-center">Lista de Pessoas Inativas</h3>
                <table className="min-w-full bg-gray-800 text-white text-center">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b border-gray-700">Nome</th>
                            <th className="py-2 px-4 border-b border-gray-700">Email</th>
                            <th className="py-2 px-4 border-b border-gray-700">Usuário</th>
                            <th className="py-2 px-4 border-b border-gray-700">Função</th>
                            <th className="py-2 px-4 border-b border-gray-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.filter(user => user.ativo === 0).map((user, index) => (
                            <tr key={user.id} className="text-gray-500 italic">
                                <td className="py-2 px-4 border-b border-gray-700">{user.nome}</td>
                                <td className="py-2 px-4 border-b border-gray-700">{user.email}</td>
                                <td className="py-2 px-4 border-b border-gray-700">{user.usuario}</td>
                                <td className="py-2 px-4 border-b border-gray-700">{funcoes.find(f => f.id === user.funcao_id)?.descricao}</td>
                                <td className="py-2 px-4 border-b text-gray-100 border-gray-700">
                                    <button onClick={() => handleActiveUsuario(user.id)} className="mr-2">
                                        <FaUndo />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default PessoaCadastro;
