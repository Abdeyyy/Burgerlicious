#!/bin/bash
sudo mkdir -p /opt/lampp/htdocs/Burgerlicious
sudo rsync -av --exclude 'node_modules' --exclude '.git' --exclude '.gemini' /home/aniiporangbaik/Burgerlicious/ /opt/lampp/htdocs/Burgerlicious/
sudo chown -R $USER:daemon /opt/lampp/htdocs/Burgerlicious
sudo chmod -R 775 /opt/lampp/htdocs/Burgerlicious
echo -e "\nBerhasil menyalin project ke /opt/lampp/htdocs/Burgerlicious"
