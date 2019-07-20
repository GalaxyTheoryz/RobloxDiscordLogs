--[[
	ServerScript in ServerScriptService
    Make two BindableEvents in ServerStorage, one called "RunCommandBindable", one called "CommandRanBindable"
    You can hook the two up to your admin system
    Make a BoolValue in ServerStorage called "ChatlogsDebug" to get logging output
    Errors will always be logged, but the script will restart because of the pcall
    For Discord to Roblox chat, make a RemoteEvent in ReplicatedStorage called "ChatBroadcastDiscord",
    and add the LocalScript in StarterPlayerScripts
]]
local DebugActive = game:GetService("ServerStorage"):FindFirstChild("ChatlogsDebug") and game.ServerStorage.ChatlogsDebug.Value;
local realprint = print
local function print(...)
    if (DebugActive) then
        local data = {...};
        for i = 1, #data do
            if typeof(data[i]) == "table" then
                for j = 1, #data[i] do
                    print(data[i][j]);
                end;
            else
                realprint("Chatlogs:", data[i]);
            end;
        end;
    end;
end;

local success, err
while not success do
success, err = pcall(function() -- start pcall function
local posturl = "http://your.domain.here/bot/"
local httpservice = game:GetService("HttpService")
local chat = game:GetService("Chat")
local marketplaceService = game:GetService("MarketplaceService")
local gamename = marketplaceService:GetProductInfo(game.PlaceId).Name
local ChatBroadcastRemote = game:GetService("ReplicatedStorage").ChatBroadcastDiscord
local CommandRanBindable = game.ServerStorage:FindFirstChild("CommandRanBindable")
local RunCommandBindable = game.ServerStorage:FindFirstChild("RunCommandBindable")
local startdata = {
	["type"] = "newserver",
}
local startdataencoded = httpservice:JSONEncode(startdata)
local responsestart = httpservice:PostAsync(posturl, startdataencoded)
print("Got serverstart post response: ")
print(responsestart)
local startresponsedecoded = httpservice:JSONDecode(responsestart)
local servernum = startresponsedecoded.servernum
if not servernum then error("Didn't receive servernum") end

local messagequeue = {}
local function onPlayerChatted(msg, target, player)
    local data = {
        username = player.Name,
        content = msg,
    }
    if (target) then
        data.username = player.Name.." to "..target.Name
    end
    -- local encodeddata = httpservice:JSONEncode(data)
    messagequeue[#messagequeue+1] = data
end

local function onPlayerAdded(plr)
    plr.Chatted:Connect(function(msg,target)
        onPlayerChatted(msg,target,plr)
    end)
end

game:GetService("Players").PlayerAdded:Connect(onPlayerAdded)

local commandqueue = {}
local function onCommandRan(CommandContainer)
    local rawcommand = CommandContainer.Raw
    local commandname = CommandContainer.Name
    local args = CommandContainer.Args
    local ran = CommandContainer.Ran
    local player = CommandContainer.Player
    local data = {
        username = player.Name,
        command = rawcommand,
        ran = ran,
    }
    commandqueue[#commandqueue+1] = data
end

CommandRanBindable.Event:Connect(onCommandRan)

local count = 0

local function onHeartbeat(delta)
    count = count + delta
    if (count > 5) then
        count = 0
        local requestdata = {
            ["type"] = "heartbeat",
            ["servernum"] = servernum,
            ["messages"] = messagequeue,
            ["commands"] = commandqueue,
            ["gamename"] = gamename,
        }
        messagequeue = {}
        commandqueue = {}
        local playerarray = {}
        local players = game.Players:GetPlayers()
        for i = 1, #players do
            playerarray[i] = players[i].Name
        end
        requestdata.players = playerarray
        local encodedArray = httpservice:JSONEncode(requestdata)
        print("Posting now")
        local messages = httpservice:PostAsync(posturl, encodedArray)
        print("Got post response: ")
        print(messages)
        local messagesDecoded = httpservice:JSONDecode(messages)
        if (messagesDecoded.messages) then
            print(messagesDecoded.messages)
            local players = game.Players:GetPlayers()
            for i = 1, #messagesDecoded.messages do
                local v = messagesDecoded.messages[i]
                -- Can't filter for offline or non-user...
                -- Message filtered as if sent by local user....
                -- Use at your own risk, I am not responsible for your game getting moderated for bad chat filtering
                for j = 1, #players do
                    local filtered = chat:FilterStringAsync(v.message, players[j],players[j])
                    ChatBroadcastRemote:FireClient(players[j], "["..v.username.."]: "..filtered)
                end

            end
		end
		if (messagesDecoded.commands) then
			print(messagesDecoded.commands)
			for i = 1, #messagesDecoded.commands do
				RunCommandBindable:Fire(messagesDecoded.commands[i])
			end
        end
    end
end

game:GetService("RunService").Heartbeat:Connect(onHeartbeat)

game:BindToClose(function()
    local data = {
        ["type"] = "serverclose",
        ["servernum"] = servernum,
        ["gamename"] = gamename,
    }
    local encodeddata = httpservice:JSONEncode(data)
    httpservice:PostAsync(posturl, encodeddata)
end)
end) -- end pcall function
if not success then
    warn("Chatlogs error: ")
    warn(err)
end
end -- end while loop
