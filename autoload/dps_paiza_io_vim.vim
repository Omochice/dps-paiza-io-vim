function! dps_paiza_io_vim#call() abort
  call denops#plugin#wait('paiza-io')
  call denops#notify('paiza-io', 'paizaIO', [])
endfunction
