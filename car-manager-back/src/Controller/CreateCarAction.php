<?php

namespace App\Controller;

use App\Entity\Car;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;

#[AsController]
class CreateCarAction extends AbstractController
{
    public function __invoke(Request $request, EntityManagerInterface $em): JsonResponse
    {
        // On recupere l'utilisateur connecte grace au Token JWT
        /** @var User|null $user */
        $user = $this->getUser();

        // Securite : on verifie que l'utilisateur est bien identifie
        if (!$user) {
            return new JsonResponse(['status' => 'error', 'message' => 'Utilisateur non authentifie'], 401);
        }

        $car = new Car();

        // ON ATTACHE LE PROPRIETAIRE (Indispensable pour la base de donnees)
        $car->setOwner($user);

        // On recupere toutes les donnees textuelles envoyees par Angular
        $car->setBrand($request->request->get('brand', ''));
        $car->setModel($request->request->get('model', ''));
        $car->setLicensePlate($request->request->get('licensePlate', ''));
        $car->setCurrentKm((int) $request->request->get('currentKm', 0));
        $car->setNextServiceKm((int) $request->request->get('nextServiceKm', 0));

        $nextCtDate = $request->request->get('nextCtDate');
        if ($nextCtDate && $nextCtDate !== 'null') {
            try {
                $car->setNextCtDate(new \DateTime($nextCtDate));
            } catch (\Exception $e) {
                // La date sera ignoree si le format est invalide
            }
        }

        // On recupere et on attache le fichier (VichUploader fera le reste)
        $file = $request->files->get('imageFile');
        if ($file) {
            $car->setImageFile($file);
        }

        // On sauvegarde manuellement dans la base de donnees
        $em->persist($car);
        $em->flush();

        return new JsonResponse(['status' => 'success', 'message' => 'Voiture enregistree avec succes'], 201);
    }
}
