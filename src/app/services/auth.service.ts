import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth, authState, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut, getRedirectResult } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Observable, map, from, tap } from 'rxjs';
import { UserProfile } from '../models/budget.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private platformId = inject(PLATFORM_ID);

  user$: Observable<UserProfile | null> = authState(this.auth).pipe(
    map(user => user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null),
    tap(user => {
      if (user) {
        this.saveUserProfile(user);
      }
    })
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      getRedirectResult(this.auth).catch(err => {
        console.error('Erreur lors de la récupération du résultat de redirection:', err);
      });
    }
  }

  private saveUserProfile(user: UserProfile) {
    if (!isPlatformBrowser(this.platformId)) return;
    const userRef = doc(this.firestore, `users/${user.uid}`);
    setDoc(userRef, user, { merge: true });
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    // Utiliser signInWithPopup mais avec une gestion d'erreur plus robuste
    // Si COOP bloque toujours, il faudra peut-être passer à signInWithRedirect
    try {
      return await signInWithPopup(this.auth, provider);
    } catch (error: any) {
      console.error('Erreur de connexion Google (popup):', error);
      // Si le popup est bloqué ou s'il y a un problème de politique d'ouverture cross-origin
      if (error.code === 'auth/popup-blocked' || error.message?.includes('Cross-Origin-Opener-Policy')) {
        console.info('Tentative de connexion par redirection...');
        return await signInWithRedirect(this.auth, provider);
      }
      throw error;
    }
  }

  async logout() {
    return await signOut(this.auth);
  }
}
