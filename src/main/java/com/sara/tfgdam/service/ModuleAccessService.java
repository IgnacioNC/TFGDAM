package com.sara.tfgdam.service;

import com.sara.tfgdam.domain.entity.CourseModule;
import com.sara.tfgdam.domain.entity.UserAccount;
import com.sara.tfgdam.domain.entity.UserRole;
import com.sara.tfgdam.exception.ResourceNotFoundException;
import com.sara.tfgdam.repository.CourseModuleRepository;
import com.sara.tfgdam.security.AuthenticatedUserResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModuleAccessService {

    private final CourseModuleRepository courseModuleRepository;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Transactional(readOnly = true)
    public List<CourseModule> getAccessibleModules() {
        UserAccount currentUser = authenticatedUserResolver.getCurrentUser();
        if (isSuperAdmin(currentUser)) {
            return courseModuleRepository.findAllWithTeacherOrderById();
        }
        return courseModuleRepository.findAllByOwnerIdWithTeacherOrderById(currentUser.getId());
    }

    @Transactional(readOnly = true)
    public CourseModule getAccessibleModule(Long moduleId) {
        UserAccount currentUser = authenticatedUserResolver.getCurrentUser();
        if (isSuperAdmin(currentUser)) {
            return courseModuleRepository.findById(moduleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));
        }
        return courseModuleRepository.findByIdAndOwnerId(moduleId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));
    }

    @Transactional(readOnly = true)
    public void assertCanAccessModule(Long moduleId) {
        getAccessibleModule(moduleId);
    }

    @Transactional(readOnly = true)
    public UserAccount getCurrentUser() {
        return authenticatedUserResolver.getCurrentUser();
    }

    private boolean isSuperAdmin(UserAccount user) {
        return user.getRoles() != null && user.getRoles().contains(UserRole.ROLE_SUPERADMIN);
    }
}
