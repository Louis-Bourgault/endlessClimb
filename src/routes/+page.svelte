<script lang="ts">
	import { onMount } from 'svelte';
	import { PerlinNoise } from '$lib/generators/perlin';
	import { InfiniteClimbGame } from '$lib/game/gameEngine.svelte';
	let canvas: HTMLCanvasElement;
    let loading: boolean = false;
	let game: InfiniteClimbGame |null = $state(null);
	let debugOverlay: boolean = $state(false);
	let settingsPanel: boolean = $state(true);
	import { generators,  } from "$lib/generators/index";
	import type { GenSetting, GeneratorInstance, numberGenSetting } from '$lib/generators/types';
	let currentGenerator: GeneratorInstance | null = null;
	let currentGeneratorEntry:any = $state(generators[0]);

	let scalingFactor = $state(1);
	let threshold = $state(0.53);

	$effect(() => {
		if (currentGeneratorEntry) {
			scalingFactor = currentGeneratorEntry.scalingAndThreshold.scaling;
			threshold = currentGeneratorEntry.scalingAndThreshold.threshold;
		}
	});

	$inspect(currentGeneratorEntry);



    onMount(() => {
		newGame();

    });

	function newGame() {
		game?.stopGame();
		currentGenerator = new PerlinNoise(currentGeneratorEntry.settings);
		game = new InfiniteClimbGame(canvas, document, currentGenerator, scalingFactor, threshold);
		game.start();
	}
</script>

<svelte:window
	on:resize={() => {
		if (canvas) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}
		console.log('Window resized to', window.innerWidth, 'x', window.innerHeight);
	}}
/>

{#if loading}
    <div
        class="loading-overlay"
        style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 255, 255, 1); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <p>Loading...</p>
    </div>
{/if}



{#if debugOverlay}
	<div
	        class="loading-overlay"
	        style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: 1000; color:red">
	        <p>Debug Overlay </p>
			<p>Player coordinates: {game?.playerCoordinates.x}, {game?.playerCoordinates.y}</p>
			<p>Velocity: {game?.velocity.x}, {game?.velocity.y}</p>
			<p>current fps: {game?.currentFPS}</p>
			<p> isgrounded: {game?.isGrounded}</p>
	    </div>
{/if}




{#if settingsPanel}
	<div
	        class="loading-overlay"
	        style="position: fixed; top: 0; left: 0; width: 20%; height: 20%; z-index: 1000; color:black; background-color:bisque">
	        <p>Settings Panel</p>
			<select bind:value={currentGeneratorEntry}>
				{#each generators as generator}
					<option value={generator}>{generator.name}</option>
				{/each}
			</select>
			{#each currentGeneratorEntry.settings as setting }
				<div>
						<label>{setting.name}</label>
						{#if setting.settingType === 'number'}
							<input type="number" bind:value={setting.setting.value} min={setting.setting.minimum} max={setting.setting.maximum} />
						{:else if setting.settingType === 'options'}
							<select bind:value={setting.setting.value}>
								{#each setting.setting.options as option}
									<option value={option}>{option}</option>
								{/each}
							</select>
						{/if}
				</div>
			{/each}
			{#if currentGeneratorEntry.scalingAndThreshold.customisable}
				<div>
					<label>Scaling Factor</label>
					<input type="number" bind:value={scalingFactor} min="1" />
				</div>
				<div>
					<label>Threshold</label>
					<input type="number" bind:value={threshold} min="0" max="1" step="0.01" />
				</div>
			{/if}
			<button onclick={newGame}>Start Game with new settings</button>
	    </div>
{/if}

	

<canvas
	width="500"
	height="500"
	style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; image-rendering: pixelated;"
	bind:this={canvas}
>
</canvas>
