; electron/build/installer.nsh
!macro customInstall
  ; Inicia o serviço de bandeja imediatamente após a instalação.
  ExecWait 'cscript //NoLogo "$INSTDIR\resources\service\run-silent.vbs"'

  ; Configura o serviço para iniciar com o Windows, criando um atalho na pasta Startup.
  CreateShortCut "$SMSTARTUP\Botfood Service.lnk" 'cscript' '//NoLogo "$INSTDIR\resources\service\run-silent.vbs"'
!macroend