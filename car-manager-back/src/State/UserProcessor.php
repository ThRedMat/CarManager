<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Car;
use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class UserProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private Security $security
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = [])
    {
        // Si c'est une voiture et qu'elle n'a pas de propriétaire...
        if ($data instanceof Car && $data->getOwner() === null) {
            // On lui colle l'utilisateur actuellement connecté !
            $user = $this->security->getUser();
            $data->setOwner($user);
        }

        // On laisse API Platform faire le reste (sauvegarder en base)
        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
