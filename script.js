
// =====================================================================
        // SUBSYSTEM 3: ADVANCED SHADER & PARTICLE FX MANAGER (EXTENDED)
        // =====================================================================
        class ParticleFXEngine {
            constructor(sceneRef) {
                this.scene = sceneRef;
                this.activeEmitters = [];
            }

            createShockwave(position, colorHex = 0x00f0ff) {
                const geometry = new THREE.RingGeometry(0.1, 1.2, 32);
                const material = new THREE.MeshBasicMaterial({
                    color: colorHex,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.9
                });
                const ring = new THREE.Mesh(geometry, material);
                ring.position.copy(position);
                ring.rotation.x = Math.PI / 2;
                this.scene.add(ring);

                let scale = 1.0;
                let opacity = 0.9;
                
                const animInterval = setInterval(() => {
                    scale += 0.4;
                    opacity -= 0.08;
                    ring.scale.set(scale, scale, scale);
                    material.opacity = Math.max(0, opacity);

                    if (opacity <= 0) {
                        this.scene.remove(ring);
                        geometry.dispose();
                        material.dispose();
                        clearInterval(animInterval);
                    }
                }, 16);
            }

            createEnergyTrail(sourceMesh, colorHex) {
                const count = 40;
                const geom = new THREE.BufferGeometry();
                const positions = new Float32Array(count * 3);
                
                for(let i=0; i<count*3; i+=3) {
                    positions[i] = sourceMesh.position.x + (Math.random() - 0.5) * 0.5;
                    positions[i+1] = sourceMesh.position.y + (Math.random() - 0.5) * 0.5;
                    positions[i+2] = sourceMesh.position.z + (Math.random() - 0.5) * 0.5;
                }
                
                geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                const mat = new THREE.PointsMaterial({ size: 0.1, color: colorHex, transparent: true, opacity: 0.7 });
                const points = new THREE.Points(geom, mat);
                this.scene.add(points);

                setTimeout(() => {
                    this.scene.remove(points);
                    geom.dispose();
                    mat.dispose();
                }, 400);
            }
        }

        // =====================================================================
        // SUBSYSTEM 4: PHYSICS & HITBOX COLLISION RESOLVER
        // =====================================================================
        class CollisionResolver {
            static checkBoundingBox(fighterA, fighterB) {
                const boxA = new THREE.Box3().setFromObject(fighterA.mesh);
                const boxB = new THREE.Box3().setFromObject(fighterB.mesh);
                return boxA.intersectsBox(boxB);
            }

            static resolvePush(fighterA, fighterB) {
                const dist = fighterA.mesh.position.distanceTo(fighterB.mesh.position);
                if (dist < 1.8) {
                    const dir = new THREE.Vector3().subVectors(fighterA.mesh.position, fighterB.mesh.position).normalize();
                    fighterA.mesh.position.addScaledVector(dir, 0.05);
                    fighterB.mesh.position.addScaledVector(dir, -0.05);
                }
            }
        }

        // =====================================================================
        // SUBSYSTEM 5: ADVANCED AI STATE MACHINE (FSM)
        // =====================================================================
        class AdvancedFighterAI {
            constructor(selfFighter, targetFighter) {
                this.self = selfFighter;
                this.target = targetFighter;
                this.state = 'APPROACH'; // APPROACH, ATTACK, CHARGE, EVADE
                this.stateTimer = 0;
            }

            update(fxEngine) {
                if (!this.self || !this.target) return;
                this.stateTimer++;

                const distance = this.self.mesh.position.distanceTo(this.target.mesh.position);

                // FSM Transition Logic
                if (this.self.hp < 30 && Math.random() < 0.03) {
                    this.state = 'EVADE';
                } else if (this.self.ki < 40 && distance > 6.0) {
                    this.state = 'CHARGE';
                } else if (distance <= 2.2) {
                    this.state = 'ATTACK';
                } else {
                    this.state = 'APPROACH';
                }

                // State Execution
                switch (this.state) {
                    case 'APPROACH':
                        this.self.mesh.position.x += (this.target.mesh.position.x > this.self.mesh.position.x ? 1 : -1) * 0.06;
                        this.self.mesh.position.z += (this.target.mesh.position.z > this.self.mesh.position.z ? 1 : -1) * 0.04;
                        break;
                    case 'ATTACK':
                        if (this.stateTimer % 35 === 0) {
                            const dmg = Math.random() > 0.4 ? 12 : 7;
                            this.target.hp = Math.max(0, this.target.hp - dmg);
                            fxEngine.createShockwave(this.target.mesh.position, 0xff0055);
                        }
                        break;
                    case 'CHARGE':
                        this.self.isCharging = true;
                        this.self.ki = Math.min(100, this.self.ki + 1.2);
                        if (this.self.aura) this.self.aura.visible = true;
                        break;
                    case 'EVADE':
                        this.self.mesh.position.x += (this.target.mesh.position.x > this.self.mesh.position.x ? -1 : 1) * 0.12;
                        break;
                }
            }
        }

        // Instanciación global de los nuevos motores auxiliares
        let globalFxEngine = null;
        let globalAIController = null;

        // Hook extendido al inicializar la batalla
        const originalStartMatch = window.startMatch || function(){};
        window.startMatchExtended = function() {
            if (window.player1 && window.player2) {
                globalFxEngine = new ParticleFXEngine(scene);
                globalAIController = new AdvancedFighterAI(window.player2, window.player1);
            }
        };
