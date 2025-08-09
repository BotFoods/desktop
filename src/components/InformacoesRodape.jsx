const InformarcoesRodape = () => {
    const currentYear = new Date().getFullYear();
    return (
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gray-800 border-t border-gray-700">
            <div className="space-y-2 text-xs text-gray-400">
                <p className="flex justify-between">
                    <span>Suporte:</span>
                    <a href="mailto:suporte@botfood.com" className="text-blue-400 hover:text-blue-300">
                        suporte@botfood.com.br
                    </a>
                </p>
                <p className="flex justify-between">
                    <span>Contato:</span>
                    <span>(12) 93618-0756</span>
                </p>
                <p className="text-center mt-3 text-gray-500">
                    &copy; {currentYear} BotFood - Todos os direitos reservados
                </p>
            </div>
        </div>
    )
}

export default InformarcoesRodape;