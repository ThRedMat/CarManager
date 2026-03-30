<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
// --- ON CHANGE CET IMPORT ---
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class UserPasswordHasherProcessor implements ProcessorInterface
{
    public function __construct(
        // On utilise Autowire avec la clé 'service' pour cibler l'ID exact
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = [])
    {
        if ($data instanceof User && $data->getPlainPassword()) {
            $hashedPassword = $this->passwordHasher->hashPassword($data, $data->getPlainPassword());
            $data->setPassword($hashedPassword);

            // On nettoie le mot de passe en clair pour la sécurité
            $data->setPlainPassword(null);
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
