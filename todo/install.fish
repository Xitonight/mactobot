#!/usr/bin/env fish

if test -f .env
    echo ".env file found"
    # Add your code here to handle the presence of .env file
else
    echo ".env file not found"
    # Add your code here to handle the absence of .env file
end

function option1
    echo "You selected Option 1"
    # Add your code for Option 1 here
end

function option2
    echo "You selected Option 2"
    # Add your code for Option 2 here
end

function option3
    echo "You selected Option 3"
    # Add your code for Option 3 here
end

function show_menu
    echo "Main Menu:"
    echo "1. Option 1"
    echo "2. Option 2"
    echo "3. Option 3"
    echo "0. Exit"

    read -p "Enter your choice: " choice

    switch $choice
        case 1
            option1
        case 2
            option2
        case 3
            option3
        case 0
            echo "Exiting..."
            return
        default
            echo "Invalid choice. Please try again."
            show_menu
    end
end

function install_dependencies
    echo "Installing dependencies..."
    pacman -Sy
    pacman -S fisher --noconfirm
    fisher install jorgebucaran/nvm.fish
    nvm install && nvm use
    npm install
end

show_menu