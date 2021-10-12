if exists('g:loaded_dps_paiza_io') && g:loaded_dps_paiza_io
  finish
endif

let g:loaded_dps_paiza_io = v:true

command! PaizaIO call dps_paiza_io_vim#call()
