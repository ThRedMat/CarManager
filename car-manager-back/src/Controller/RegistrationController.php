<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class RegistrationController extends AbstractController
{
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request, UserPasswordHasherInterface $passwordHasher, EntityManagerInterface $entityManager): JsonResponse
    {
        // 1. On récupère les données envoyées par Angular
        $data = json_decode($request->getContent(), true);

        // Petite sécurité : vérifie que tout est là
        if (!isset($data['email']) || !isset($data['password'])) {
            return new JsonResponse(['error' => 'Données incomplètes'], 400);
        }

        // 2. On crée le nouvel utilisateur
        $user = new User();
        $user->setEmail($data['email']);
        $user->setFirstName($data['firstName'] ?? ''); // ?? '' évite le crash si vide
        $user->setLastName($data['lastName'] ?? '');

        // 3. IMPORTANT : On hache le mot de passe (on ne stocke jamais en clair !)
        $hashedPassword = $passwordHasher->hashPassword(
            $user,
            $data['password']
        );
        $user->setPassword($hashedPassword);

        // 4. On sauvegarde dans la base
        $entityManager->persist($user);
        $entityManager->flush();

        return new JsonResponse(['message' => 'Utilisateur créé avec succès !'], 201);
    }
}
