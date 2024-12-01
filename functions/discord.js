export async function onRequestPost(context) {
    const body = await context.request.json();
    const discordResponse = await fetch(`https://discord.com/api/v10/channels/1312136843617243216/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${context.secrets.DISCORD_BOT_TOKEN}`,
        },
        body: JSON.stringify(body),
    });
    // Relay Discord's response back to the client
    const responseData = await discordResponse.json();
    return new Response(JSON.stringify(responseData), {
        status: discordResponse.status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
