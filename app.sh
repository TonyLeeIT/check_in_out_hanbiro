#!/bin/sh

echo $1
curl -X GET "https://api.telegram.org/bot5556332883:AAHy12ZkS5OzCcpQ_cFuRwpVrXK58I91zaE/sendMessage?chat_id=-742959189&text=$1"
