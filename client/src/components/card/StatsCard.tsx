import { entitySchema } from "@/lib/consts";
import { EntityType } from "@/lib/types";
import * as Icons from "lucide-react";

interface StatsCardsProps {
    stats: any;
    entity: EntityType;
}

export function StatsCards({ stats, entity }: StatsCardsProps) {
    const schema = entitySchema[entity];
    const cardsConfig = schema?.statsCards ?? [];

    console.log("Stats 1" , stats);
    

    // console.log(stats)
    function getValue(obj: any, path: string, defaultValue: any = 0) {
        return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? defaultValue;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {cardsConfig.map((card, index) => {
                const IconComponent = (Icons[card.icon as keyof typeof Icons] || Icons.Package) as Icons.LucideIcon;
                const value = getValue(stats, card.key, 0);
                const displayValue = card.format ? card.format(value) : value;

                return (
                    <div key={index} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className={`${card.color} rounded-lg p-3 mr-4`}>
                                <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}