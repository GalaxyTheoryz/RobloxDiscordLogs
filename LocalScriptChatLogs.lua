-- Put in StarterPlayerScripts for Discord to Roblox chat
local startergui = game:GetService("StarterGui")
local color = BrickColor.new(1020) -- Message and Username color

game:GetService("ReplicatedStorage"):WaitForChild("ChatBroadcastDiscord").OnClientEvent:Connect(function(message)
	startergui:SetCore("ChatMakeSystemMessage", {
		Text = message;
		Color = color.Color;
	})
end)