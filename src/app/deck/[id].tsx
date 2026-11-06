import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	type DeckCard,
	createCard,
	deleteCard,
	getCards,
	getDueCards,
	reviewCard,
} from '../../../services/decks';

const colors = {
	blue: '#3975F6',
	ink: '#111111',
	muted: '#5A5A66',
	yellow: '#FFD33D',
	lilac: '#F0E7FF',
};


const ratings = [
	{ label: 'Errei', quality: 1, color: '#FF3B78' },
	{ label: 'Difícil', quality: 3, color: '#FF9500' },
	{ label: 'Bom', quality: 4, color: '#12B886' },
	{ label: 'Fácil', quality: 5, color: '#3975F6' },
];

function messageOf(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}


function StudySession({
	deckId,
	cards,
	onFinish,
}: {
	deckId: number;
	cards: DeckCard[];
	onFinish: () => void;
}) {
	const [index, setIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	const card = cards[index];

	const handleRate = async (quality: number) => {
		if (saving) return;
		setSaving(true);
		setError('');
		try {
			await reviewCard(deckId, card.id, quality);
			if (index + 1 >= cards.length) {
				onFinish();
			} else {
				setIndex(index + 1);
				setFlipped(false);
			}
		} catch (e) {
			setError(messageOf(e, 'Não foi possível salvar a revisão.'));
		} finally {
			setSaving(false);
		}
	};

	return (
		<View style={styles.studyWrap}>
			<Text style={styles.studyProgress}>
				{index + 1} / {cards.length}
			</Text>

			<Pressable onPress={() => setFlipped((value) => !value)} style={styles.studyCard}>
				<Text style={styles.studySide}>{flipped ? 'Resposta' : 'Pergunta'}</Text>
				<Text style={styles.studyText}>{flipped ? card.backText : card.frontText}</Text>
				{!flipped && <Text style={styles.studyHint}>Toque para ver a resposta</Text>}
			</Pressable>

			{error ? <Text style={styles.errorDark}>{error}</Text> : null}

			{flipped ? (
				<View style={styles.ratingRow}>
					{ratings.map((rating) => (
						<Pressable
							disabled={saving}
							key={rating.label}
							onPress={() => handleRate(rating.quality)}
							style={({ pressed }) => [
								styles.ratingButton,
								{ backgroundColor: rating.color },
								(pressed || saving) && styles.pressed,
							]}
						>
							<Text style={styles.ratingText}>{rating.label}</Text>
						</Pressable>
					))}
				</View>
			) : null}

			<Pressable onPress={onFinish} style={styles.exitStudy}>
				<Text style={styles.exitStudyText}>Sair do estudo</Text>
			</Pressable>
		</View>
	);
}


function AddCardModal({
	visible,
	onClose,
	onSave,
}: {
	visible: boolean;
	onClose: () => void;
	onSave: (frontText: string, backText: string) => Promise<void>;
}) {
	const [front, setFront] = useState('');
	const [back, setBack] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	const canSave = front.trim().length > 0 && back.trim().length > 0 && !saving;

	const close = () => {
		setFront('');
		setBack('');
		setError('');
		onClose();
	};

	const handleSave = async () => {
		if (!canSave) return;
		setSaving(true);
		setError('');
		try {
			await onSave(front.trim(), back.trim());
			close();
		} catch (e) {
			setError(messageOf(e, 'Não foi possível criar o card.'));
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal animationType="fade" onRequestClose={close} transparent visible={visible}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.modalBackdrop}
			>
				<Pressable onPress={close} style={StyleSheet.absoluteFill} />
				<View style={styles.modalCard}>
					<Text style={styles.modalLabel}>Frente do card</Text>
					<TextInput
						multiline
						onChangeText={setFront}
						placeholder="Pergunta"
						placeholderTextColor="#8A8A99"
						style={styles.input}
						value={front}
					/>

					<Text style={[styles.modalLabel, { marginTop: 16 }]}>Verso do card</Text>
					<TextInput
						multiline
						onChangeText={setBack}
						placeholder="Resposta"
						placeholderTextColor="#8A8A99"
						style={styles.input}
						value={back}
					/>

					{error ? <Text style={styles.errorDark}>{error}</Text> : null}

					<Pressable
						disabled={!canSave}
						onPress={handleSave}
						style={({ pressed }) => [
							styles.modalButton,
							!canSave && styles.disabled,
							pressed && canSave && styles.pressed,
						]}
					>
						<Text style={styles.modalButtonText}>{saving ? 'Salvando...' : 'Criar card'}</Text>
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

// ---------- Tela do deck ----------
export default function DeckDetailScreen() {
	const params = useLocalSearchParams<{ id: string; name?: string; color?: string }>();
	const deckId = Number(params.id);
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const [cards, setCards] = useState<DeckCard[]>([]);
	const [dueCards, setDueCards] = useState<DeckCard[]>([]);
	const [tab, setTab] = useState<'all' | 'due'>('all');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showAdd, setShowAdd] = useState(false);
	const [studying, setStudying] = useState(false);

	const accent = params.color ?? colors.yellow;

	const load = useCallback(async () => {
		setError('');
		try {
			const [all, due] = await Promise.all([getCards(deckId), getDueCards(deckId)]);
			setCards(all);
			setDueCards(due);
		} catch (e) {
			setError(messageOf(e, 'Não foi possível carregar os cards.'));
		} finally {
			setLoading(false);
		}
	}, [deckId]);

	useEffect(() => {
		void load();
	}, [load]);

	const handleCreate = async (frontText: string, backText: string) => {
		await createCard(deckId, { frontText, backText });
		await load();
	};

	const handleDelete = (card: DeckCard) => {
		Alert.alert('Excluir card', 'Tem certeza que deseja excluir este card?', [
			{ text: 'Cancelar', style: 'cancel' },
			{
				text: 'Excluir',
				style: 'destructive',
				onPress: async () => {
					try {
						await deleteCard(deckId, card.id);
						await load();
					} catch (e) {
						setError(messageOf(e, 'Não foi possível excluir o card.'));
					}
				},
			},
		]);
	};

	const finishStudy = async () => {
		setStudying(false);
		setLoading(true);
		await load();
	};

	const visibleCards = tab === 'all' ? cards : dueCards;

	return (
		<View style={styles.screen}>
			<View style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 8 }]}>
				<Pressable accessibilityLabel="Voltar" hitSlop={12} onPress={() => router.back()}>
					<Text style={styles.back}>‹</Text>
				</Pressable>
				<View style={[styles.colorDot, { backgroundColor: accent }]} />
				<Text numberOfLines={1} style={styles.title}>
					{params.name ?? 'Deck'}
				</Text>
			</View>

			{studying ? (
				<StudySession cards={dueCards} deckId={deckId} onFinish={finishStudy} />
			) : (
				<View style={styles.sheet}>
					<View style={styles.summaryRow}>
						<View>
							<Text style={styles.summaryNumber}>{cards.length}</Text>
							<Text style={styles.summaryLabel}>cards</Text>
						</View>
						<View>
							<Text style={styles.summaryNumber}>{dueCards.length}</Text>
							<Text style={styles.summaryLabel}>para revisar</Text>
						</View>
						<Pressable
							disabled={dueCards.length === 0}
							onPress={() => setStudying(true)}
							style={({ pressed }) => [
								styles.studyButton,
								dueCards.length === 0 && styles.disabled,
								pressed && styles.pressed,
							]}
						>
							<Text style={styles.studyButtonText}>Estudar</Text>
						</Pressable>
					</View>

					<View style={styles.tabs}>
						{(['all', 'due'] as const).map((key) => (
							<Pressable
								key={key}
								onPress={() => setTab(key)}
								style={[styles.tab, tab === key && styles.tabActive]}
							>
								<Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
									{key === 'all' ? 'Todos' : 'Para revisar'}
								</Text>
							</Pressable>
						))}
					</View>

					<ScrollView
						contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
						showsVerticalScrollIndicator={false}
					>
						{loading ? <ActivityIndicator color={colors.blue} style={styles.loader} /> : null}
						{error ? <Text style={styles.errorDark}>{error}</Text> : null}

						{!loading && !error && visibleCards.length === 0 ? (
							<Text style={styles.empty}>
								{tab === 'all'
									? 'Este deck ainda não tem cards. Toque em "Novo card" para criar.'
									: 'Nenhum card para revisar agora. 🎉'}
							</Text>
						) : null}

						{visibleCards.map((card) => (
							<Pressable
								key={card.id}
								onLongPress={() => handleDelete(card)}
								style={({ pressed }) => [styles.cardItem, pressed && styles.pressed]}
							>
								<Text numberOfLines={2} style={styles.cardFront}>
									{card.frontText}
								</Text>
								<Text numberOfLines={2} style={styles.cardBack}>
									{card.backText}
								</Text>
							</Pressable>
						))}

						{!loading && visibleCards.length > 0 ? (
							<Text style={styles.tip}>Segure um card para excluir</Text>
						) : null}
					</ScrollView>

					<Pressable
						onPress={() => setShowAdd(true)}
						style={({ pressed }) => [
							styles.fab,
							{ bottom: insets.bottom + 24 },
							pressed && styles.pressed,
						]}
					>
						<Text style={styles.fabText}>Novo card</Text>
					</Pressable>
				</View>
			)}

			<AddCardModal onClose={() => setShowAdd(false)} onSave={handleCreate} visible={showAdd} />
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { backgroundColor: colors.blue, flex: 1 },

	header: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingBottom: 18, paddingHorizontal: 20 },
	back: { color: '#FFFFFF', fontSize: 40, fontWeight: '300', lineHeight: 40, marginTop: -4 },
	colorDot: { borderColor: '#FFFFFF', borderRadius: 11, borderWidth: 2, height: 22, width: 22 },
	title: { color: '#FFFFFF', flex: 1, fontSize: 28, fontWeight: '900' },

	sheet: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 22,
	},

	summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
	summaryNumber: { color: colors.ink, fontSize: 30, fontWeight: '900' },
	summaryLabel: { color: colors.muted, fontSize: 13 },
	studyButton: { backgroundColor: colors.yellow, borderRadius: 12, paddingHorizontal: 26, paddingVertical: 12 },
	studyButtonText: { color: colors.ink, fontSize: 15, fontWeight: '800' },

	tabs: { backgroundColor: colors.lilac, borderRadius: 12, flexDirection: 'row', marginTop: 20, padding: 4 },
	tab: { alignItems: 'center', borderRadius: 9, flex: 1, paddingVertical: 9 },
	tabActive: { backgroundColor: colors.blue },
	tabText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
	tabTextActive: { color: '#FFFFFF' },

	loader: { marginTop: 32 },
	empty: { color: colors.muted, fontSize: 14, marginTop: 32, textAlign: 'center' },
	tip: { color: colors.muted, fontSize: 12, marginTop: 14, textAlign: 'center' },
	errorDark: { color: '#D6223F', fontSize: 14, marginTop: 16, textAlign: 'center' },

	cardItem: {
		backgroundColor: colors.lilac,
		borderRadius: 14,
		marginTop: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	cardFront: { color: colors.ink, fontSize: 16, fontWeight: '800' },
	cardBack: { color: colors.muted, fontSize: 14, marginTop: 4 },

	fab: {
		alignItems: 'center',
		alignSelf: 'flex-end',
		backgroundColor: colors.yellow,
		borderRadius: 12,
		elevation: 4,
		height: 50,
		justifyContent: 'center',
		position: 'absolute',
		right: 20,
		shadowColor: '#163EA5',
		shadowOffset: { height: 3, width: 0 },
		shadowOpacity: 0.35,
		shadowRadius: 2,
		width: 160,
	},
	fabText: { color: colors.ink, fontSize: 15, fontWeight: '800' },

	
	studyWrap: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 24,
	},
	studyProgress: { color: colors.muted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
	studyCard: {
		alignItems: 'center',
		backgroundColor: colors.lilac,
		borderRadius: 22,
		justifyContent: 'center',
		marginTop: 20,
		minHeight: 280,
		padding: 24,
	},
	studySide: { color: colors.blue, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
	studyText: { color: colors.ink, fontSize: 26, fontWeight: '800', marginTop: 12, textAlign: 'center' },
	studyHint: { color: colors.muted, fontSize: 13, marginTop: 20 },
	ratingRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
	ratingButton: { alignItems: 'center', borderRadius: 12, flex: 1, paddingVertical: 14 },
	ratingText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
	exitStudy: { alignItems: 'center', marginTop: 24, padding: 8 },
	exitStudyText: { color: colors.muted, fontSize: 14, fontWeight: '700' },

	
	modalBackdrop: {
		alignItems: 'center',
		backgroundColor: 'rgba(17, 17, 17, 0.4)',
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
	modalCard: { backgroundColor: '#FFFFFF', borderRadius: 24, maxWidth: 420, padding: 20, width: '100%' },
	modalLabel: { color: colors.ink, fontSize: 16, fontWeight: '800' },
	input: {
		borderColor: '#A9A9B8',
		borderRadius: 10,
		borderWidth: 1,
		color: colors.ink,
		fontSize: 16,
		marginTop: 8,
		minHeight: 48,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	modalButton: {
		alignItems: 'center',
		backgroundColor: colors.yellow,
		borderRadius: 10,
		height: 44,
		justifyContent: 'center',
		marginTop: 22,
	},
	modalButtonText: { color: colors.ink, fontSize: 15, fontWeight: '800' },

	disabled: { opacity: 0.45 },
	pressed: { opacity: 0.75 },
});