# dps-paiza-io-vim

The vim/neovim plugin for execute the code by [Paiza IO](https://paiza.io/en) web API.

## Installation

Use your favorite plugin manager!
- `vim-plug`
    ```vim
    Plug 'vim-denops/denops.vim'
    Plug 'Omochice/dps-paiza-io-vim'
    ```

- `dein.vim`
    ```vim
    call dein#add("vim-denops/denops.vim")
    call dein#add("Omochice/dps-paiza-io-vim")
    ```
or another one.

## Usage

![usaseMovie](https://i.gyazo.com/32e69148c653a8c3902441253871b815.gif)

Run `:PaizaIO`, the code in current window is executed on web API and display the output/error in new window.

*Caution, [Paiza.io](https://paiza.io/en) has a **1 second** run time limit.*

## TODO

- fix bugs
    - After execution, if change window to other code and run `:PaizaIO` then show old result.
    - ~~Each execution make new window every time.~~ Resolved by #2
- add options
    - Switch Python2/3
