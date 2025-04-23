#!/bin/bash

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (sudo)"
    exit 1
fi

# Install tcpdump if not present
if ! command -v tcpdump &> /dev/null; then
    echo "Installing tcpdump..."
    apt-get update && apt-get install -y tcpdump
fi

# Create tcpdump group if it doesn't exist
if ! getent group tcpdump > /dev/null; then
    groupadd tcpdump
fi

# Add current user to tcpdump group
usermod -a -G tcpdump $SUDO_USER

# Set capabilities for tcpdump
setcap cap_net_raw,cap_net_admin=eip $(which tcpdump)

# Set proper ownership and permissions for tcpdump
chown root:tcpdump $(which tcpdump)
chmod 750 $(which tcpdump)

# Create and set permissions for temp directory
TEMP_DIR="$(dirname "$0")/temp"
mkdir -p "$TEMP_DIR"
chown -R $SUDO_USER:$SUDO_USER "$TEMP_DIR"
chmod 755 "$TEMP_DIR"

echo "Setup completed. Please log out and log back in for group changes to take effect."
