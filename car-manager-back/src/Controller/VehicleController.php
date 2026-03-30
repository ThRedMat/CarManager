<?php

namespace App\Controller;

use App\Entity\Car;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class VehicleController extends AbstractController
{
    #[Route('/api/vehicles/{id}', name: 'api_vehicle_delete', methods: ['DELETE'])]
    public function deleteVehicle(Car $vehicle, EntityManagerInterface $entityManager): JsonResponse
    {
        // 1. On récupère l'utilisateur connecté via le Token JWT
        $user = $this->getUser();

        // 2. Sécurité : On vérifie que le véhicule appartient bien à l'utilisateur
        if ($vehicle->getOwner() !== $user) {
            return $this->json(['error' => 'Action non autorisée.'], 403);
        }

        // 3. On supprime le véhicule
        $entityManager->remove($vehicle);
        $entityManager->flush();

        return $this->json(['message' => 'Véhicule retiré du garage avec succès.'], 200);
    }
}
