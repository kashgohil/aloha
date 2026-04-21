"use client";

import { TelegramIcon } from "@/app/auth/_components/provider-icons";
import { Plus, ShieldCheck, Sparkle } from "lucide-react";
import { useState } from "react";
import { disconnectTelegram } from "../../actions";
import { TelegramChannelItem } from "./telegram-item";
import { ConfirmDeleteForm } from "@/components/ui/confirm-dialog";

type Props = {
	isConnected: boolean;
	needsReauth?: boolean;
	atLimit?: boolean;
};

export function TelegramListItem({ isConnected, needsReauth, atLimit }: Props) {
	const [showForm, setShowForm] = useState(false);

	return (
		<li className="flex flex-col px-5 py-4">
			<div className="flex items-center gap-4">
				<span
					className={`w-11 h-11 rounded-full border grid place-items-center shrink-0 text-ink ${
						needsReauth
							? "bg-primary-soft border-primary/40"
							: isConnected
								? "bg-peach-100 border-peach-300"
								: "bg-background border-border"
					}`}
				>
					<TelegramIcon className="w-[18px] h-[18px]" />
				</span>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<p className="text-[14.5px] text-ink font-medium">Telegram</p>
						{isConnected && !needsReauth ? (
							<span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background text-[10.5px] font-medium tracking-wide">
								<ShieldCheck className="w-3 h-3" />
								Connected
							</span>
						) : null}
						{needsReauth ? (
							<span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-primary-soft text-primary-deep text-[10.5px] font-medium tracking-wide">
								Reconnect needed
							</span>
						) : null}
						<span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-peach-100 border border-peach-300 text-[10.5px] text-ink font-medium tracking-wide">
							<Sparkle className="w-3 h-3" />
							Muse
						</span>
					</div>
					<p className="mt-1 text-[12.5px] text-ink/60">
						{showForm
							? "Authenticate with your phone number"
							: needsReauth
								? "Your session expired or was revoked. Reconnect to resume publishing."
								: "Broadcast messages and photos to your channel."}
					</p>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					{showForm ? (
						<button
							type="button"
							onClick={() => setShowForm(false)}
							className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-deep transition-colors"
						>
							Close
						</button>
					) : !isConnected && atLimit ? (
						<button
							type="button"
							disabled
							className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border-strong text-[13px] text-ink/40 cursor-not-allowed"
						>
							<Plus className="w-3.5 h-3.5" />
							Connect
						</button>
					) : (
						<button
							type="button"
							onClick={() => setShowForm(true)}
							className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-deep transition-colors"
						>
							{!isConnected ? <Plus className="w-3.5 h-3.5" /> : null}
							{isConnected ? "Reconnect" : "Connect"}
						</button>
					)}
					{isConnected ? (
						<ConfirmDeleteForm
							action={async () => {
								await disconnectTelegram();
							}}
							title="Disconnect Telegram?"
							description="This will remove the connection to your Telegram channel. You can reconnect it later."
							confirmText="Disconnect"
							className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-primary-deep hover:bg-peach-100/60 transition-colors disabled:opacity-50"
						>
							Disconnect
						</ConfirmDeleteForm>
					) : null}
				</div>
			</div>
			{showForm && (
				<div className="pl-15 py-4 bg-background-elev/50">
					<TelegramChannelItem isConnected={isConnected} />
				</div>
			)}
		</li>
	);
}
