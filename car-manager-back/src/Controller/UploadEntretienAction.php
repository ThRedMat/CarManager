<?php

namespace App\Controller;

use App\Entity\Entretien;
use App\Entity\Car;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;

#[AsController]
class UploadEntretienAction extends AbstractController
{
    public function __invoke(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $entretien = new Entretien();

        // 1. On recupere les champs textes de base
        $entretien->setType($request->request->get('type'));
        $entretien->setLibelle($request->request->get('libelle'));

        if ($request->request->get('garage')) {
            $entretien->setGarage($request->request->get('garage'));
        }

        if ($request->request->get('kmRealise')) {
            $entretien->setKmRealise((int) $request->request->get('kmRealise'));
        }

        if ($request->request->get('montant')) {
            $entretien->setMontant((float) $request->request->get('montant'));
        }

        if ($request->request->get('dateRealisation')) {
            $entretien->setDateRealisation(new \DateTimeImmutable($request->request->get('dateRealisation')));
        }

        // --- NOUVEAUX CHAMPS (Pour la logique des alertes) ---
        if ($request->request->get('kmProchain')) {
            $entretien->setKmProchain((int) $request->request->get('kmProchain'));
        }

        if ($request->request->get('dateProchaine')) {
            $entretien->setDateProchaine(new \DateTimeImmutable($request->request->get('dateProchaine')));
        }
        // ------------------------------------------------------

        // 2. On fait le lien avec la voiture AVEC VERIFICATION DE SECURITE
        $carIri = $request->request->get('car');
        if ($carIri) {
            $carId = basename($carIri);
            $car = $em->getRepository(Car::class)->find($carId);

            // VERIFICATION CRUCIALE : La voiture existe-t-elle et appartient-elle au bon utilisateur ?
            if (!$car || $car->getOwner() !== $this->getUser()) {
                return new JsonResponse(['message' => 'Vehicule introuvable ou acces refuse'], 403);
            }

            $entretien->setCar($car);
        } else {
            return new JsonResponse(['message' => 'Aucune voiture specifiee'], 400);
        }

        // 3. Le fichier physique
        $file = $request->files->get('invoiceFile');
        if ($file) {
            $entretien->setInvoiceFile($file);
        }

        // 4. On sauvegarde nous-memes
        $em->persist($entretien);
        $em->flush();

        // 5. On retourne une vraie reponse Symfony
        return new JsonResponse(['message' => 'Entretien et facture enregistres avec succes'], 201);
    }
}
